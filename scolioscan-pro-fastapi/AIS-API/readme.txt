# Scoliosis Detection and Classification Pipeline

This repository contains an automated deep learning pipeline for evaluating spinal images. It utilizes a two-stage cascade approach to efficiently screen for scoliosis and classify the specific curvature type.

## 🚀 Pipeline Overview

The system processes images sequentially through three main stages:

1. **Stage 1: Keypoint Screening (Keras)**
   * A lightweight model detects 10 spinal keypoints.
   * Keypoints are paired symmetrically to calculate 5 orientation angles.
   * **Rule:** If the mean angle is <= 4°, the patient is screened as "Normal" (No scoliosis), and the pipeline skips the heavy computation. If > 4°, it proceeds to Stage 2.
2. **Stage 2: Detailed Angle Regression (TensorFlow Lite)**
   * A high-precision TFLite model predicts three specific spinal angles (Cobb angles).
3. **Stage 3: Scoliosis Classification**
   * Based on the three predicted angles and a clinical threshold (default 8°), the spine is classified into specific types: `Normal`, `Thoracic`, `Double Thoracic`, `Double major`, `Triple curve`, or `Lumbar`.

---

## 📁 Directory Structure

Before running the code, ensure your project directory is organized as follows:

project_root/
│
├── main.py                     # The main pipeline script
├── requirements.txt            # Python dependencies
│
├── keypointsmodel/             # Keras keypoint model files
│   ├── keypoints_architecture.json
│   └── keypoints_weigts.hdf5
│
├── tflite/                     # TFLite regression model
│   └── model_fp32.tflite
│
└── test2/                      # Your target dataset folder
    └── initial_img/            # Place all testing images here (.jpg, .png)
        ├── patient001.jpg
        ├── patient002.png
        └── ...

---

## 🛠️ Installation & Setup

1. **Clone or Download** this repository to your local machine.
2. **Set up a Python environment** (Python 3.7+ recommended).
3. **Install the dependencies** by running the following command in your terminal:

pip install -r requirements.txt

*(Dependencies include: `numpy`, `Pillow`, and `tensorflow`)*

---

## 💻 Usage

You can run the pipeline directly from your terminal. 

### Basic Run (Using Default Paths)
If your directory matches the structure above, simply run:

python main.py

### Advanced Run (Using Custom Paths)
You can use command-line arguments to specify different folders or models without modifying the Python code:

python main.py --basepath "/path/to/your/dataset" --kp_arch "./keypointsmodel/custom_arch.json" --kp_weights "./keypointsmodel/custom_weights.hdf5" --tf_model "./tflite/custom_model.tflite"

### ⚙️ Command-Line Arguments

| Argument       | Type  | Default Value                                  | Description                                                                 |
| :------------- | :---- | :--------------------------------------------- | :-------------------------------------------------------------------------- |
| `--basepath`   | `str` | `./test2`                                      | The base directory containing the `initial_img` folder with your images.    |
| `--kp_arch`    | `str` | `./keypointsmodel/keypoints_architecture.json` | Path to the JSON file defining the Keypoint model architecture.             |
| `--kp_weights` | `str` | `./keypointsmodel/keypoints_weigts.hdf5`       | Path to the HDF5 file containing the Keypoint model weights.                |
| `--tf_model`   | `str` | `./tflite/model_fp32.tflite`                   | Path to the TFLite regression model.                                        |

---

## 📊 Expected Output

The script will process each image in the `initial_img` folder and print the diagnostic steps to the console:

Loading keypoint detection model...
Loading TFLite regression model...

Starting processing. Found 2 images.
========================================
Processing: patient001.jpg
   => Screening Result: Average angle 2.15° <= 4°
   => Diagnosis: No scoliosis detected. Skipping detailed prediction.

Processing: patient002.jpg
   => Screening Result: Average angle 12.40° > 4°. Initiating detailed evaluation...
   => TFLite Predicted Angles: Angle1=15.20°, Angle2=22.10°, Angle3=5.40°
   => Classification Result: Double Thoracic (Bent-Bent-Straight)