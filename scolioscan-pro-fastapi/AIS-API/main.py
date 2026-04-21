import os
import argparse
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import model_from_json

# ================= 1. Configuration and Helper Functions =================

def parse_opt():
    parser = argparse.ArgumentParser()
    parser.add_argument('--basepath', type=str, default='./test2', help='task base path')
    parser.add_argument('--kp_arch', type=str, default='./keypointsmodel/keypoints_architecture.json', help='keypoint model arch')
    parser.add_argument('--kp_weights', type=str, default='./keypointsmodel/keypoints_weigts.hdf5', help='keypoint model weights')
    parser.add_argument('--tf_model', type=str, default='./tflite/model_fp32.tflite', help='tflite model path')
    return parser.parse_args()

def classify_three(a, b, c, threshold=8):
    """Classify scoliosis type based on three angles."""
    labels = ['Straight' if x <= threshold else 'Bent' for x in (a, b, c)]
    mapping = {
        ('Straight', 'Straight', 'Straight'): 'Normal',
        ('Straight', 'Bent',     'Straight'): 'Thoracic',
        ('Bent',     'Bent',     'Straight'): 'Double Thoracic', # Fixed spelling error from original code
        ('Straight', 'Bent',     'Bent')    : 'Double major',
        ('Bent',     'Bent',     'Bent')    : 'Triple curve',
        ('Straight', 'Straight', 'Bent')    : 'Lumbar',
    }
    t = mapping.get(tuple(labels))
    pattern = '-'.join(labels)
    if t is None:
        print(f"   => Classification Result: Undefined pattern ({pattern})")
    else:
        print(f"   => Classification Result: {t} ({pattern})")
    return t, labels, pattern

def denor(x, maxn, minn):
    """Denormalization"""
    return x * (maxn - minn) + minn

# Normalization extremum parameters for the keypoint model
UMIN = -0.46649292628443784
UMAX = 0.36221122112211224
VMIN = -0.2185929648241206
VMAX = 0.4490084985835694


# ================= 2. Main Pipeline =================

def main(opt):
    # ---------------- A. Load Models ----------------
    print("Loading keypoint detection model...")
    with open(opt.kp_arch, 'r') as f:
        kp_model = model_from_json(f.read())
    kp_model.load_weights(opt.kp_weights)

    print("Loading TFLite regression model...")
    interpreter = tf.lite.Interpreter(model_path=opt.tf_model, num_threads=4)
    interpreter.allocate_tensors()
    tf_inp = interpreter.get_input_details()[0]
    tf_out = interpreter.get_output_details()[0]

    # ---------------- B. Get List of Images to Process ----------------
    folder_path = os.path.join(opt.basepath, "initial_img")
    if not os.path.exists(folder_path):
        print(f"Directory does not exist: {folder_path}")
        return

    file_list = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    file_list.sort()

    print(f"\nStarting processing. Found {len(file_list)} images.\n" + "="*40)

    # ---------------- C. Iterate Through Images and Process ----------------
    for filename in file_list:
        img_path = os.path.join(folder_path, filename)
        print(f"Processing: {filename}")
        
        # 1. Read and prepare the base image
        img = Image.open(img_path).convert('RGB')
        w, h = img.size
        b_cx, b_cy = w / 2, h / 2
        
        # ================= Stage 1: Keypoint Screening =================
        img_kp = np.array(img.resize((256, 256), Image.LANCZOS)) / 255.0
        img_kp = np.expand_dims(img_kp, axis=0) # shape (1, 256, 256, 3)
        
        predictions = kp_model.predict(img_kp, verbose=0)
        u0, v0 = np.split(predictions, 2, axis=-1)
        
        y_nor10 = denor(u0, UMAX, UMIN)
        y_nor20 = denor(v0, VMAX, VMIN)
        y_nor0 = np.concatenate((y_nor10, y_nor20), axis=-1).reshape(10, 2)
        
        # Restore to original image coordinates
        keypoints = np.zeros((10, 2))
        keypoints[:, 0] = y_nor0[:, 0] * w + b_cx
        keypoints[:, 1] = -y_nor0[:, 1] * h + b_cy
        
        # Calculate 5 sets of angles
        angles_degrees = []
        for i in range(5): # Changed to range(5) to process all 5 symmetric pairs
            j = 9 - i 
            x1, y1 = keypoints[i]
            x2, y2 = keypoints[j]
            dx = x2 - x1
            dy = y1 - y2  # Y-axis inverted: mathematically, upwards is positive
            
            angle_rad = np.arctan2(dy, dx)
            angle_deg = abs(np.degrees(angle_rad))
            angles_degrees.append(angle_deg)
            
        mean_angle = np.mean(angles_degrees)
        
        # Check against threshold
        if mean_angle <= 4.0:
            print(f"   => Screening Result: Average angle {mean_angle:.2f}° <= 4°")
            print("   => Diagnosis: No scoliosis detected. Skipping detailed prediction.\n")
            continue  # Skip TFLite prediction, proceed to next image

        print(f"   => Screening Result: Average angle {mean_angle:.2f}° > 4°. Initiating detailed evaluation...")

        # ================= Stage 2: Detailed Angle Prediction (TFLite) =================
        img_tf = img.resize((1024, 1024), Image.BILINEAR)
        x_tf = np.asarray(img_tf, dtype=np.float32)[None, ...] # shape (1, 1024, 1024, 3)
        
        # Note: Uncomment the following line if your TFLite model was trained with /255.0 normalization
        # x_tf /= 255.0

        # Quantization processing (if int8 model)
        if tf_inp["dtype"] == np.int8:
            scale, zero = tf_inp["quantization"]
            x_tf = np.round(x_tf / scale + zero).astype(np.int8)

        # Dynamically adjust input Tensor size
        if tuple(tf_inp["shape"]) != x_tf.shape:
            interpreter.resize_tensor_input(tf_inp["index"], x_tf.shape)
            interpreter.allocate_tensors()
            tf_inp = interpreter.get_input_details()[0]
            tf_out = interpreter.get_output_details()[0]

        # Execute inference
        interpreter.set_tensor(tf_inp["index"], x_tf)
        interpreter.invoke()
        pred_angles = interpreter.get_tensor(tf_out["index"]).squeeze().astype(np.float32)

        # Dequantization processing (if int8 output)
        if tf_out["dtype"] == np.int8:
            scale, zero = tf_out["quantization"]
            pred_angles = (pred_angles - zero) * scale

        a1, a2, a3 = float(pred_angles[0]), float(pred_angles[1]), float(pred_angles[2])
        print(f"   => TFLite Predicted Angles: Angle1={a1:.2f}°, Angle2={a2:.2f}°, Angle3={a3:.2f}°")
        
        # ================= Stage 3: Classification =================
        classify_three(a1, a2, a3, threshold=8)
        print() # Print a newline for better readability

if __name__ == '__main__':
    opt = parse_opt()
    main(opt)