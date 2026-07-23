# -*- coding: utf-8 -*-
"""
AIS numeric API version

This script converts the original Tkinter AIS screening tool into a FastAPI service.
It returns numeric JSON only:
    - 11 predicted landmark points
    - AIS risk score and numeric risk level
    - four evidence indicators
    - optional 3 Cobb angles when AIS risk is triggered

Expected files in the same folder as this script:
    best_11points_vgg.weights.h5
    best_angle_mlp_points_features.weights.h5
    norm_params.json
    scaler_params.json

Run:
    python ais_numeric_api.py

Then open:
    http://127.0.0.1:8000/docs

Install:
    pip install fastapi uvicorn python-multipart tensorflow opencv-python pillow numpy rembg
"""

import os
import io
import json
import math
from typing import Optional, Dict, Any, List

import cv2
import numpy as np
from PIL import Image, ImageOps

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import VGG19
from tensorflow.keras.applications.vgg19 import preprocess_input
from tensorflow.keras.models import Model

from rembg import remove, new_session

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# Paths
# ============================================================
APP_DIR = os.path.dirname(os.path.abspath(__file__))

KEYPOINT_WEIGHT_PATH = os.path.join(APP_DIR, "best_11points_vgg.weights.h5")
ANGLE_WEIGHT_PATH = os.path.join(APP_DIR, "best_angle_mlp_points_features.weights.h5")

KEYPOINT_NORM_PATH = os.path.join(APP_DIR, "norm_params.json")
ANGLE_SCALER_PATH = os.path.join(APP_DIR, "scaler_params.json")

# ============================================================
# Parameters
# ============================================================
POINT_COUNT = 11
IMG_SIZE = 256

RISK_SCORE_SUSPECT = 20
RISK_SCORE_HIGH = 50
STRONG_POSITIVE_COUNT_THR = 2

USE_SEGMENTATION_DEFAULT = True
SEG_MODEL_NAME = "u2net_human_seg"
USE_ALPHA_MATTING = True
ALPHA_MATTING_FOREGROUND_THRESHOLD = 240
ALPHA_MATTING_BACKGROUND_THRESHOLD = 10
ALPHA_MATTING_ERODE_SIZE = 10

HOST = "127.0.0.1"
PORT = 8000

# risk_level_id:
# 0 = normal_like
# 1 = low_risk
# 2 = suspected_level
# 3 = high_risk
RISK_LEVEL_ID = {
    "normal_like": 0,
    "low_risk": 1,
    "suspected_level": 2,
    "high_risk": 3,
}

EVIDENCE_INFO = [
    {
        "id": 1,
        "name": "neck_tilt_angle",
        "unit_id": 1,  # degree
        "low_thr": 3.0,
        "high_thr": 8.0,
        "weight": 10.0,
    },
    {
        "id": 2,
        "name": "shoulder_complex_tilt",
        "unit_id": 1,  # degree
        "low_thr": 3.0,
        "high_thr": 8.0,
        "weight": 35.0,
    },
    {
        "id": 3,
        "name": "waist_elbow_horizontal_distance_asymmetry",
        "unit_id": 2,  # ratio
        "low_thr": 0.05,
        "high_thr": 0.16,
        "weight": 15.0,
    },
    {
        "id": 4,
        "name": "trunk_centerline_offset_asymmetry",
        "unit_id": 2,  # ratio
        "low_thr": 0.06,
        "high_thr": 0.18,
        "weight": 40.0,
    },
]

# ============================================================
# GPU memory-growth setup
# ============================================================
gpus = tf.config.list_physical_devices("GPU")
for gpu in gpus:
    try:
        tf.config.experimental.set_memory_growth(gpu, True)
    except Exception:
        pass

# ============================================================
# Lazy global assets
# ============================================================
seg_session = None
keypoint_model = None
angle_model = None
keypoint_norm = None
angle_scaler = None


# ============================================================
# Numeric helper functions
# ============================================================
def line_angle_deg(a: np.ndarray, b: np.ndarray) -> float:
    dx = float(b[0] - a[0])
    dy = float(b[1] - a[1])
    return float(math.degrees(math.atan2(dy, dx)))


def dist(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.sqrt(np.sum((a - b) ** 2)))


def safe_ratio(a: float, b: float) -> float:
    if abs(b) < 1e-8:
        return 0.0
    return float(a / b)


def evidence_score(value: float, low_thr: float, high_thr: float, weight: float) -> float:
    v = abs(float(value))
    if v <= low_thr:
        return 0.0
    if v >= high_thr:
        return float(weight)
    return float((v - low_thr) / (high_thr - low_thr) * weight)


def point_xy(pts: Dict[int, np.ndarray], pid: int) -> np.ndarray:
    return np.array(pts[pid], dtype=np.float32)


def dist2(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.sqrt(np.sum((a - b) ** 2)))


def angle_line(a: np.ndarray, b: np.ndarray) -> float:
    dx = float(b[0] - a[0])
    dy = float(b[1] - a[1])
    ang = np.arctan2(dy, dx) / np.pi
    return float(ang)


def safe_ratio_clip(a: float, b: float) -> float:
    if abs(b) < 1e-8:
        return 0.0
    r = float(a / b)
    return float(np.clip(r, -5.0, 5.0))


def read_image_from_bytes(file_bytes: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(file_bytes))
    img = ImageOps.exif_transpose(img).convert("RGB")
    return img


def read_image_from_path(image_path: str) -> Image.Image:
    if not os.path.exists(image_path):
        raise FileNotFoundError(image_path)
    img = Image.open(image_path)
    img = ImageOps.exif_transpose(img).convert("RGB")
    return img


# ============================================================
# Background removal
# ============================================================
def segment_person_to_white_bg(img_pil: Image.Image, use_segmentation: bool = True) -> Image.Image:
    global seg_session

    img_pil = ImageOps.exif_transpose(img_pil).convert("RGB")

    if not use_segmentation:
        return img_pil

    if seg_session is None:
        seg_session = new_session(SEG_MODEL_NAME)

    result = remove(
        img_pil,
        session=seg_session,
        alpha_matting=USE_ALPHA_MATTING,
        alpha_matting_foreground_threshold=ALPHA_MATTING_FOREGROUND_THRESHOLD,
        alpha_matting_background_threshold=ALPHA_MATTING_BACKGROUND_THRESHOLD,
        alpha_matting_erode_size=ALPHA_MATTING_ERODE_SIZE,
        post_process_mask=True,
    )

    result = result.convert("RGBA")
    white_bg = Image.new("RGBA", result.size, (255, 255, 255, 255))
    white_bg.paste(result, (0, 0), result)

    return white_bg.convert("RGB")


# ============================================================
# Keypoint model
# ============================================================
def build_keypoint_model() -> Model:
    inputs = layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3))

    vgg_base = VGG19(
        weights="imagenet",
        include_top=False,
        input_tensor=inputs,
    )

    vgg_feature = vgg_base.get_layer("block3_conv4").output
    vgg_model = Model(inputs=inputs, outputs=vgg_feature)
    vgg_model.trainable = False

    x = vgg_model.output

    qq = 16

    x = layers.Conv2D(qq, (3, 3), padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)

    x = layers.Conv2D(qq * 2, (3, 3), padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)

    x = layers.Conv2D(qq * 4, (3, 3), padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)

    x = layers.Conv2D(qq * 8, (3, 3), padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.GlobalAveragePooling2D()(x)

    x = layers.Dense(512, activation="relu")(x)
    x = layers.Dropout(0.3)(x)

    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)

    outputs = layers.Dense(POINT_COUNT * 2, activation="sigmoid", name="keypoints")(x)

    model = models.Model(inputs=inputs, outputs=outputs)
    return model


def load_keypoint_assets():
    global keypoint_model, keypoint_norm

    if not os.path.exists(KEYPOINT_WEIGHT_PATH):
        raise FileNotFoundError(KEYPOINT_WEIGHT_PATH)

    if not os.path.exists(KEYPOINT_NORM_PATH):
        raise FileNotFoundError(KEYPOINT_NORM_PATH)

    if keypoint_norm is None:
        with open(KEYPOINT_NORM_PATH, "r", encoding="utf-8") as f:
            keypoint_norm = json.load(f)

    if keypoint_model is None:
        keypoint_model = build_keypoint_model()
        keypoint_model.load_weights(KEYPOINT_WEIGHT_PATH)

    return keypoint_model, keypoint_norm


def predict_keypoints_on_image(img_pil: Image.Image) -> List[Dict[str, float]]:
    model, norm_params = load_keypoint_assets()

    img_w, img_h = img_pil.size

    img_rgb = np.array(img_pil.convert("RGB"))
    img_256 = cv2.resize(img_rgb, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    x_input = img_256.astype(np.float32)[None, ...]
    x_input = preprocess_input(x_input)

    pred_nor = model.predict(x_input, verbose=0)[0].reshape(POINT_COUNT, 2)

    u_min = float(norm_params["u_min"])
    u_max = float(norm_params["u_max"])
    v_min = float(norm_params["v_min"])
    v_max = float(norm_params["v_max"])

    eps = 1e-8

    pred_center = np.zeros((POINT_COUNT, 2), dtype=np.float32)
    pred_center[:, 0] = pred_nor[:, 0] * (u_max - u_min + eps) + u_min
    pred_center[:, 1] = pred_nor[:, 1] * (v_max - v_min + eps) + v_min

    pred_pixel = np.zeros((POINT_COUNT, 2), dtype=np.float32)
    pred_pixel[:, 0] = pred_center[:, 0] * img_w + img_w / 2.0
    pred_pixel[:, 1] = img_h / 2.0 - pred_center[:, 1] * img_h

    pred_pixel[:, 0] = np.clip(pred_pixel[:, 0], 0, img_w - 1)
    pred_pixel[:, 1] = np.clip(pred_pixel[:, 1], 0, img_h - 1)

    out_points = []

    for i in range(POINT_COUNT):
        out_points.append({
            "id": int(i + 1),
            "x": float(round(float(pred_pixel[i, 0]), 3)),
            "y": float(round(float(pred_pixel[i, 1]), 3)),
        })

    return out_points


# ============================================================
# Cobb angle model
# ============================================================
def make_20_engineered_features(pts: Dict[int, np.ndarray]) -> np.ndarray:
    p1 = point_xy(pts, 1)
    p2 = point_xy(pts, 2)
    p3 = point_xy(pts, 3)
    p4 = point_xy(pts, 4)
    p5 = point_xy(pts, 5)
    p6 = point_xy(pts, 6)
    p7 = point_xy(pts, 7)
    p8 = point_xy(pts, 8)
    p9 = point_xy(pts, 9)
    p10 = point_xy(pts, 10)
    p11 = point_xy(pts, 11)

    neck_mid = (p1 + p2) / 2.0
    shoulder_mid = (p3 + p4) / 2.0
    upperarm_mid = (p5 + p6) / 2.0
    waist_mid = (p7 + p8) / 2.0
    forearm_mid = (p9 + p10) / 2.0

    shoulder_w = dist2(p3, p4)
    if shoulder_w < 1e-8:
        shoulder_w = 1.0

    upper_w = dist2(p5, p6)
    waist_w = dist2(p7, p8)

    body_center_x = np.median([
        neck_mid[0],
        shoulder_mid[0],
        upperarm_mid[0],
        waist_mid[0],
        forearm_mid[0],
        p11[0],
    ])

    f = []

    f.append(angle_line(p1, p2))
    f.append(angle_line(p3, p4))
    f.append(angle_line(p5, p6))
    f.append(angle_line(p7, p8))
    f.append(angle_line(p9, p10))
    f.append(angle_line(neck_mid, p11))
    f.append(angle_line(shoulder_mid, waist_mid))

    f.append(angle_line(p3, p5))
    f.append(angle_line(p4, p6))
    f.append(angle_line(p5, p7))
    f.append(angle_line(p6, p8))

    f.append(safe_ratio_clip(p3[1] - p4[1], shoulder_w))
    f.append(safe_ratio_clip(p5[1] - p6[1], shoulder_w))
    f.append(safe_ratio_clip(p7[1] - p8[1], shoulder_w))
    f.append(safe_ratio_clip(p9[1] - p10[1], shoulder_w))

    f.append(safe_ratio_clip(neck_mid[0] - body_center_x, shoulder_w))
    f.append(safe_ratio_clip(waist_mid[0] - body_center_x, shoulder_w))
    f.append(safe_ratio_clip(p11[0] - body_center_x, shoulder_w))

    f.append(safe_ratio_clip(upper_w, shoulder_w))
    f.append(safe_ratio_clip(waist_w, shoulder_w))

    f = np.array(f, dtype=np.float32)
    f = np.nan_to_num(f, nan=0.0, posinf=0.0, neginf=0.0)
    f = np.clip(f, -5.0, 5.0)

    return f


def build_angle_model() -> Model:
    inputs = layers.Input(shape=(40,))

    x = layers.Dense(160, activation="relu")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.15)(x)

    x = layers.Dense(128, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.15)(x)

    x = layers.Dense(96, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.10)(x)

    x = layers.Dense(64, activation="relu")(x)
    x = layers.Dropout(0.10)(x)

    x = layers.Dense(32, activation="relu")(x)

    outputs = layers.Dense(3, activation="linear")(x)

    model = models.Model(inputs=inputs, outputs=outputs)
    return model


def load_angle_assets():
    global angle_model, angle_scaler

    if not os.path.exists(ANGLE_WEIGHT_PATH):
        raise FileNotFoundError(ANGLE_WEIGHT_PATH)

    if not os.path.exists(ANGLE_SCALER_PATH):
        raise FileNotFoundError(ANGLE_SCALER_PATH)

    if angle_scaler is None:
        with open(ANGLE_SCALER_PATH, "r", encoding="utf-8") as f:
            angle_scaler = json.load(f)

    if angle_model is None:
        angle_model = build_angle_model()
        angle_model.load_weights(ANGLE_WEIGHT_PATH)

    return angle_model, angle_scaler


def points_to_centered_dict(points_list: List[Dict[str, float]], img_w: int, img_h: int) -> Dict[int, np.ndarray]:
    pts = {}

    for p in points_list:
        pid = int(p.get("id", p.get("point_id")))
        x = float(p["x"])
        y = float(p["y"])

        x_c = (x - img_w / 2.0) / img_w
        y_c = (-y + img_h / 2.0) / img_h

        pts[pid] = np.array([x_c, y_c], dtype=np.float32)

    return pts


def predict_cobb_angles(points_list: List[Dict[str, float]], img_w: int, img_h: int) -> List[float]:
    model, scaler = load_angle_assets()

    pts = points_to_centered_dict(points_list, img_w, img_h)

    coord_feature = []

    for pid in range(1, 11):
        coord_feature.append(pts[pid][0])
        coord_feature.append(pts[pid][1])

    coord_feature = np.array(coord_feature, dtype=np.float32)
    engineered_feature = make_20_engineered_features(pts)

    x_all = np.concatenate([coord_feature, engineered_feature], axis=0).astype(np.float32)

    x_mean = np.array(scaler["x_mean"], dtype=np.float32)
    x_scale = np.array(scaler["x_scale"], dtype=np.float32)
    y_mean = np.array(scaler["y_mean"], dtype=np.float32)
    y_scale = np.array(scaler["y_scale"], dtype=np.float32)

    x_scale = np.where(np.abs(x_scale) < 1e-8, 1.0, x_scale)
    y_scale = np.where(np.abs(y_scale) < 1e-8, 1.0, y_scale)

    x_s = (x_all - x_mean) / x_scale
    pred_s = model.predict(x_s[None, :], verbose=0)[0]
    pred = pred_s * y_scale + y_mean

    return [float(pred[0]), float(pred[1]), float(pred[2])]


# ============================================================
# AIS evaluation
# ============================================================
def evaluate_ais(points_list: List[Dict[str, float]], img_w: int, img_h: int) -> Dict[str, Any]:
    pts = points_to_centered_dict(points_list, img_w, img_h)

    p1 = pts[1]
    p2 = pts[2]
    p3 = pts[3]
    p4 = pts[4]
    p5 = pts[5]
    p6 = pts[6]
    p7 = pts[7]
    p8 = pts[8]
    p9 = pts[9]
    p10 = pts[10]
    p11 = pts[11]

    shoulder_width = dist(p3, p4)
    if shoulder_width < 1e-8:
        shoulder_width = dist(p5, p6)
    if shoulder_width < 1e-8:
        shoulder_width = 1.0

    neck_tilt_angle = abs(line_angle_deg(p1, p2))

    shoulder_line_angle = abs(line_angle_deg(p3, p4))
    upper_arm_line_angle = abs(line_angle_deg(p5, p6))

    shoulder_complex_tilt = 0.3 * shoulder_line_angle + 0.7 * upper_arm_line_angle
    shoulder_complex_max = max(shoulder_line_angle, upper_arm_line_angle)

    left_waist_elbow_hdist = abs(float(p9[0] - p7[0]))
    right_waist_elbow_hdist = abs(float(p10[0] - p8[0]))

    waist_elbow_horizontal_distance_asymmetry = abs(
        safe_ratio(left_waist_elbow_hdist - right_waist_elbow_hdist, shoulder_width)
    )

    center_x = float(p11[0])

    left_ids = [1, 3, 5, 7]
    right_ids = [2, 4, 6, 8]

    level_offset_ratios = []
    level_offset_details = []

    for li, ri in zip(left_ids, right_ids):
        left_d = abs(float(pts[li][0] - center_x))
        right_d = abs(float(pts[ri][0] - center_x))

        pair_sum = left_d + right_d

        if pair_sum < 1e-8:
            pair_asym = 0.0
        else:
            pair_asym = abs(left_d - right_d) / pair_sum

        level_offset_ratios.append(pair_asym)

        level_offset_details.append({
            "left_point_id": int(li),
            "right_point_id": int(ri),
            "left_distance_to_p11_center_x": float(left_d),
            "right_distance_to_p11_center_x": float(right_d),
            "pair_asymmetry": float(pair_asym),
        })

    trunk_centerline_offset_asymmetry = float(np.mean(level_offset_ratios))
    trunk_centerline_offset_max = float(np.max(level_offset_ratios))

    evidence_values = {
        "neck_tilt_angle": neck_tilt_angle,
        "shoulder_complex_tilt": shoulder_complex_tilt,
        "waist_elbow_horizontal_distance_asymmetry": waist_elbow_horizontal_distance_asymmetry,
        "trunk_centerline_offset_asymmetry": trunk_centerline_offset_asymmetry,
    }

    detail_geometry = {
        "neck_tilt_angle_deg": float(neck_tilt_angle),
        "shoulder_line_angle_p3_p4_deg": float(shoulder_line_angle),
        "upper_arm_line_angle_p5_p6_deg": float(upper_arm_line_angle),
        "shoulder_complex_tilt_deg": float(shoulder_complex_tilt),
        "shoulder_complex_max_deg": float(shoulder_complex_max),
        "left_waist_elbow_horizontal_distance": float(left_waist_elbow_hdist),
        "right_waist_elbow_horizontal_distance": float(right_waist_elbow_hdist),
        "waist_elbow_horizontal_distance_asymmetry": float(waist_elbow_horizontal_distance_asymmetry),
        "p11_center_x": float(center_x),
        "trunk_centerline_offset_asymmetry_mean": float(trunk_centerline_offset_asymmetry),
        "trunk_centerline_offset_asymmetry_max": float(trunk_centerline_offset_max),
        "trunk_centerline_offset_level_details": level_offset_details,
        "shoulder_width_norm": float(shoulder_width),
    }

    evidence_list = []
    total_score = 0.0
    positive_count = 0
    strong_positive_count = 0

    for info in EVIDENCE_INFO:
        name = info["name"]
        value = float(evidence_values[name])
        low_thr = float(info["low_thr"])
        high_thr = float(info["high_thr"])
        weight = float(info["weight"])

        score = evidence_score(value, low_thr, high_thr, weight)
        total_score += score

        positive = 1 if value >= low_thr else 0
        strong_positive = 1 if value >= high_thr else 0

        positive_count += positive
        strong_positive_count += strong_positive

        if strong_positive:
            state_id = 2
        elif positive:
            state_id = 1
        else:
            state_id = 0

        evidence_list.append({
            "id": int(info["id"]),
            "value": float(value),
            "unit_id": int(info["unit_id"]),
            "low_thr": float(low_thr),
            "high_thr": float(high_thr),
            "weight": float(weight),
            "score": float(score),
            "positive": int(positive),
            "strong_positive": int(strong_positive),
            "state_id": int(state_id),  # 0 normal, 1 mild, 2 high
        })

    total_score = float(np.clip(total_score, 0.0, 100.0))

    if total_score >= RISK_SCORE_HIGH:
        risk_level_key = "high_risk"
    elif total_score >= RISK_SCORE_SUSPECT:
        risk_level_key = "suspected_level"
    elif total_score >= 20.0:
        risk_level_key = "low_risk"
    else:
        risk_level_key = "normal_like"

    suspected_ais = 0

    if total_score >= RISK_SCORE_SUSPECT:
        suspected_ais = 1

    if strong_positive_count >= STRONG_POSITIVE_COUNT_THR:
        suspected_ais = 1

    return {
        "risk_score_0_100": float(total_score),
        "risk_level_id": int(RISK_LEVEL_ID[risk_level_key]),
        "suspected_ais": int(suspected_ais),
        "positive_evidence_count": int(positive_count),
        "strong_positive_evidence_count": int(strong_positive_count),
        "evidence": evidence_list,
        "detail_geometry": detail_geometry,
        "score_design": {
            "neck_tilt_angle_weight": 10.0,
            "shoulder_complex_tilt_weight": 35.0,
            "waist_elbow_horizontal_distance_asymmetry_weight": 15.0,
            "trunk_centerline_offset_asymmetry_weight": 40.0,
        },
    }


# ============================================================
# Pipeline
# ============================================================
def run_pipeline_from_pil(
    img_pil: Image.Image,
    use_segmentation: bool = USE_SEGMENTATION_DEFAULT,
    force_cobb: bool = False,
) -> Dict[str, Any]:
    seg_pil = segment_person_to_white_bg(img_pil, use_segmentation=use_segmentation)
    img_w, img_h = seg_pil.size

    points = predict_keypoints_on_image(seg_pil)
    result = evaluate_ais(points, img_w, img_h)

    cobb_enabled = 1 if (result["suspected_ais"] == 1 or force_cobb) else 0
    cobb_available = 0
    cobb_error_code = 0
    cobb_angles = [-1.0, -1.0, -1.0]

    if cobb_enabled == 1:
        try:
            cobb_angles = predict_cobb_angles(points, img_w, img_h)
            cobb_available = 1
        except FileNotFoundError:
            cobb_error_code = 1
        except Exception:
            cobb_error_code = 2

    return {
        "image_width": int(img_w),
        "image_height": int(img_h),
        "segmentation_used": int(1 if use_segmentation else 0),
        "points": points,
        "risk_score_0_100": float(result["risk_score_0_100"]),
        "risk_level_id": int(result["risk_level_id"]),
        "suspected_ais": int(result["suspected_ais"]),
        "positive_evidence_count": int(result["positive_evidence_count"]),
        "strong_positive_evidence_count": int(result["strong_positive_evidence_count"]),
        "evidence": result["evidence"],
        "detail_geometry": result["detail_geometry"],
        "cobb_enabled": int(cobb_enabled),
        "cobb_available": int(cobb_available),
        "cobb_error_code": int(cobb_error_code),
        "cobb_angles_deg": [float(cobb_angles[0]), float(cobb_angles[1]), float(cobb_angles[2])],
        "score_design": result["score_design"],
    }


# ============================================================
# FastAPI definitions
# ============================================================
class PredictPathRequest(BaseModel):
    image_path: str
    use_segmentation: bool = USE_SEGMENTATION_DEFAULT
    force_cobb: bool = False


app = FastAPI(
    title="AIS Numeric Prediction API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": 1,
        "tensorflow_gpu_count": int(len(tf.config.list_physical_devices("GPU"))),
        "keypoint_weights_exist": int(os.path.exists(KEYPOINT_WEIGHT_PATH)),
        "keypoint_norm_exist": int(os.path.exists(KEYPOINT_NORM_PATH)),
        "angle_weights_exist": int(os.path.exists(ANGLE_WEIGHT_PATH)),
        "angle_scaler_exist": int(os.path.exists(ANGLE_SCALER_PATH)),
    }


@app.post("/predict/path")
def predict_from_path(req: PredictPathRequest) -> Dict[str, Any]:
    try:
        img_pil = read_image_from_path(req.image_path)
        out = run_pipeline_from_pil(
            img_pil,
            use_segmentation=bool(req.use_segmentation),
            force_cobb=bool(req.force_cobb),
        )
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error_code": 1, "error_message": str(e)})


@app.post("/predict/upload")
async def predict_from_upload(
    file: UploadFile = File(...),
    use_segmentation: bool = Form(USE_SEGMENTATION_DEFAULT),
    force_cobb: bool = Form(False),
) -> Dict[str, Any]:
    try:
        file_bytes = await file.read()
        img_pil = read_image_from_bytes(file_bytes)
        out = run_pipeline_from_pil(
            img_pil,
            use_segmentation=bool(use_segmentation),
            force_cobb=bool(force_cobb),
        )
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error_code": 1, "error_message": str(e)})


# ============================================================
# Direct Python function API
# ============================================================
def predict_image_path(
    image_path: str,
    use_segmentation: bool = USE_SEGMENTATION_DEFAULT,
    force_cobb: bool = False,
) -> Dict[str, Any]:
    img_pil = read_image_from_path(image_path)
    return run_pipeline_from_pil(img_pil, use_segmentation=use_segmentation, force_cobb=force_cobb)


# ============================================================
# Server launcher
# ============================================================
def start_server(host: str = HOST, port: int = PORT) -> None:
    """
    Start FastAPI/Uvicorn server.

    Why this wrapper exists:
    - In normal command line execution, uvicorn.run(app, ...) is OK.
    - In Spyder/Jupyter/IPython, an asyncio event loop may already be running.
      Calling uvicorn.run() directly can raise:
          RuntimeError: asyncio.run() cannot be called from a running event loop
    - If a running loop is detected, we start Uvicorn in a separate thread.
    """
    import asyncio
    import threading
    import uvicorn

    def _run_uvicorn():
        uvicorn.run(app, host=host, port=port, log_level="info")

    try:
        loop = asyncio.get_running_loop()
        running = loop.is_running()
    except RuntimeError:
        running = False

    if running:
        print("Detected an existing asyncio event loop, likely Spyder/Jupyter/IPython.")
        print("Starting Uvicorn in a background thread instead of calling asyncio.run() in this thread.")
        print(f"API docs: http://{host}:{port}/docs")
        print(f"Health:   http://{host}:{port}/health")
        server_thread = threading.Thread(target=_run_uvicorn, daemon=False)
        server_thread.start()
    else:
        print(f"API docs: http://{host}:{port}/docs")
        print(f"Health:   http://{host}:{port}/health")
        _run_uvicorn()


if __name__ == "__main__":
    start_server()
