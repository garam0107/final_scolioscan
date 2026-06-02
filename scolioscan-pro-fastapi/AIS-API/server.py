"""
AIS-API FastAPI Server
Wraps the scoliosis detection pipeline as an HTTP API for iOS/Android clients.

Endpoint: POST /ais/angle
  - Accepts multipart form data with a JPEG image (field name: "file")
  - Returns JSON with predicted angles, severity, and back type
"""

import io
import os
import logging

import numpy as np
from PIL import Image,ImageOps,ExifTags
import tensorflow as tf
from tensorflow.keras.models import model_from_json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

# ================= Configuration =================

KP_ARCH = os.environ.get("KP_ARCH", "./keypointsmodel/keypoints_architecture.json")
KP_WEIGHTS = os.environ.get("KP_WEIGHTS", "./keypointsmodel/keypoints_weigts.hdf5")
TF_MODEL = os.environ.get("TF_MODEL", "./tflite/model_fp32.tflite")

# Normalization extremum parameters for the keypoint model
UMIN = -0.46649292628443784
UMAX = 0.36221122112211224
VMIN = -0.2185929648241206
VMAX = 0.4490084985835694

SCREENING_THRESHOLD = 0.5  # degrees - below this, no scoliosis detected
CLASSIFICATION_THRESHOLD = 8  # degrees - for scoliosis type classification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ais-api")

# ================= Helper Functions =================

def denor(x, maxn, minn):
    """Denormalization"""
    return x * (maxn - minn) + minn


def classify_three(a, b, c, threshold=CLASSIFICATION_THRESHOLD):
    """Classify scoliosis type based on three angles."""
    labels = ['Straight' if x <= threshold else 'Bent' for x in (a, b, c)]
    mapping = {
        ('Straight', 'Straight', 'Straight'): 'Normal',
        ('Straight', 'Bent',     'Straight'): 'Thoracic',
        ('Bent',     'Bent',     'Straight'): 'Double Thoracic',
        ('Straight', 'Bent',     'Bent'):     'Double major',
        ('Bent',     'Bent',     'Bent'):     'Triple curve',
        ('Straight', 'Straight', 'Bent'):     'Lumbar',
    }
    back_type = mapping.get(tuple(labels), 'Unknown')
    return back_type


def get_severity(max_angle):
    """Determine severity based on the maximum Cobb angle."""
    if max_angle < 10:
        return "normal"
    elif max_angle < 25:
        return "mild"
    elif max_angle < 40:
        return "moderate"
    else:
        return "severe"


# ================= Model Loading =================

logger.info("Loading keypoint detection model...")
with open(KP_ARCH, 'r') as f:
    kp_model = model_from_json(f.read())
kp_model.load_weights(KP_WEIGHTS)

logger.info("Loading TFLite regression model...")
interpreter = tf.lite.Interpreter(model_path=TF_MODEL, num_threads=4)
interpreter.allocate_tensors()

logger.info("Models loaded successfully.")

# ================= Pipeline =================

def predict_angles(image: Image.Image) -> dict:
    """
    Run the full scoliosis detection pipeline on a single image.

    Returns dict with:
      - secondary_thoracic (상부 흉추)
      - main_thoracic (주 흉추)
      - lumbar (요추)
      - severity
      - back_type
    """
    img = image.convert('RGB')
    w, h = img.size
    b_cx, b_cy = w / 2, h / 2

    # ---- Stage 1: Keypoint Screening ----
    img_kp = np.array(img.resize((256, 256), Image.LANCZOS)) / 255.0
    img_kp = np.expand_dims(img_kp, axis=0)

    predictions = kp_model.predict(img_kp, verbose=0)
    u0, v0 = np.split(predictions, 2, axis=-1)

    y_nor10 = denor(u0, UMAX, UMIN)
    y_nor20 = denor(v0, VMAX, VMIN)
    y_nor0 = np.concatenate((y_nor10, y_nor20), axis=-1).reshape(10, 2)

    keypoints = np.zeros((10, 2))
    keypoints[:, 0] = y_nor0[:, 0] * w + b_cx
    keypoints[:, 1] = -y_nor0[:, 1] * h + b_cy

    angles_degrees = []
    for i in range(5):
        j = 9 - i
        x1, y1 = keypoints[i]
        x2, y2 = keypoints[j]
        dx = x2 - x1
        dy = y1 - y2
        angle_rad = np.arctan2(dy, dx)
        angle_deg = abs(np.degrees(angle_rad))
        angles_degrees.append(angle_deg)

    mean_angle = float(np.mean(angles_degrees))
    logger.info(f"Screening: mean_angle={mean_angle:.2f}°")

    if mean_angle <= SCREENING_THRESHOLD:
        logger.info("No scoliosis detected (below screening threshold)")
        return {
            "main_thoracic": 0.0,
            "secondary_thoracic": 0.0,
            "lumbar": 0.0,
            "severity": "normal",
            "back_type": "Normal",
        }

    # ---- Stage 2: Detailed Angle Prediction (TFLite) ----
    img_tf = img.resize((1024, 1024), Image.BILINEAR)
    x_tf = np.asarray(img_tf, dtype=np.float32)[None, ...]

    tf_inp = interpreter.get_input_details()[0]
    tf_out = interpreter.get_output_details()[0]

    if tf_inp["dtype"] == np.int8:
        scale, zero = tf_inp["quantization"]
        x_tf = np.round(x_tf / scale + zero).astype(np.int8)

    if tuple(tf_inp["shape"]) != x_tf.shape:
        interpreter.resize_tensor_input(tf_inp["index"], x_tf.shape)
        interpreter.allocate_tensors()
        tf_inp = interpreter.get_input_details()[0]
        tf_out = interpreter.get_output_details()[0]

    interpreter.set_tensor(tf_inp["index"], x_tf)
    interpreter.invoke()
    pred_angles = interpreter.get_tensor(tf_out["index"]).squeeze().astype(np.float32)

    if tf_out["dtype"] == np.int8:
        scale, zero = tf_out["quantization"]
        pred_angles = (pred_angles - zero) * scale

    # pred_angles[0] = secondary thoracic (상부 흉추)
    # pred_angles[1] = main thoracic (주 흉추)
    # pred_angles[2] = lumbar (요추)
    a1 = float(pred_angles[0])
    a2 = float(pred_angles[1])
    a3 = float(pred_angles[2])

    logger.info(f"TFLite prediction: secondary_thoracic={a1:.2f}, main_thoracic={a2:.2f}, lumbar={a3:.2f}")

    # ---- Stage 3: Classification ----
    back_type = classify_three(a1, a2, a3)
    max_angle = max(abs(a1), abs(a2), abs(a3))
    severity = get_severity(max_angle)

    return {
        "main_thoracic": round(a2, 2),
        "secondary_thoracic": round(a1, 2),
        "lumbar": round(a3, 2),
        "severity": severity,
        "back_type": back_type,
    }


# ================= FastAPI App =================

app = FastAPI(title="AIS-API", description="Scoliosis Detection and Classification API")


@app.post("/ais/angle")
async def predict_angle(file: UploadFile = File(...)):
    """
    Predict spinal angles from an uploaded image.

    Accepts: multipart/form-data with field "file" (JPEG/PNG image)
    Returns: JSON with main_thoracic, secondary_thoracic, lumbar, severity, back_type
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
    except Exception as e:
        logger.error(f"Failed to read image: {e}")
        raise HTTPException(status_code=400, detail="Failed to read image file")

    try:
        result = predict_angles(image)
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed")

    return JSONResponse(content=result)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


# ================= Landmark Detection =================
import mediapipe as mp

_mp_pose = mp.solutions.pose
_pose = _mp_pose.Pose(
    static_image_mode=True,
    model_complexity=0,
    min_detection_confidence=0.5,
)
_mp_face_detection = mp.solutions.face_detection
_face_detection = _mp_face_detection.FaceDetection(
    model_selection=1,
    min_detection_confidence=0.5,
)

@app.post("/ais/landmarks")
async def detect_landmarks(file: UploadFile = File(...)):
    """Extract 33 MediaPipe pose landmarks from image. Used for real-time pose guidance."""
    try:
        contents = await file.read()

        # 원본 이미지/EXIF 메타를 읽어 현재 사진의 방향 정보 확인
        raw_img = Image.open(io.BytesIO(contents))
        raw_exif = raw_img.getexif()
        orientation = raw_exif.get(ExifTags.Base.Orientation, 1)

        logger.debug(
            "[landmarks] raw_size=%s orientation=%s content_type=%s",
            raw_img.size,
            orientation,
            file.content_type,
        )
        # EXIF 회전을 실제 픽셀에 반영해 앱 화면 기준과 좌표계 일치
        img = ImageOps.exif_transpose(raw_img).convert("RGB")
        logger.debug("[landmarks] rgb_size=%s mode=%s", img.size, img.mode)
        # MediaPipe 입력용 numpy 배열(H, W, C)로 변환
        img_np = np.array(img)
        logger.debug("[landmarks] np_shape=%s", img_np.shape)
        face_results = _face_detection.process(img_np)
        face_detections = face_results.detections or []
        face_scores = [
            detection.score[0]
            for detection in face_detections
            if detection.score
        ]
        face_score = float(max(face_scores)) if face_scores else 0.0
        face_detected = face_score >= 0.7

        logger.debug(
            "[landmarks] face_detected=%s face_score=%.4f face_count=%s",
            face_detected,
            face_score,
            len(face_detections),
        )
        results = _pose.process(img_np)
        if not results.pose_landmarks:
            return JSONResponse({
                "detected": False,
                "landmarks": None,
                "face_detected": face_detected,
                "face_score": face_score,
                "face_count": len(face_detections),
            })

        landmarks = [
            {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
            for lm in results.pose_landmarks.landmark
        ]
        return JSONResponse({
            "detected": True,
            "landmarks": landmarks,
            "face_detected": face_detected,
            "face_score": face_score,
            "face_count": len(face_detections),
        })
    except Exception as e:
        logger.exception("landmarks detection failed")
        raise HTTPException(status_code=500, detail=str(e))
