import os
from dataclasses import dataclass
from typing import Tuple, cast

import numpy as np
from PIL import Image
from tensorflow.python.keras.models import model_from_json, Model


@dataclass(frozen=True)
class PredictionResult:
    main_thoracic: float
    secondary_thoracic: float
    lumbar: float
    severity: str
    back_type: str

    def as_tuple(self) -> tuple[float, float, float, str, str]:
        return (
            self.main_thoracic,
            self.secondary_thoracic,
            self.lumbar,
            self.severity,
            self.back_type,
        )


class ESRGANPredictor:
    """Wrap ESRGAN inference with simple, testable helper methods."""

    def __init__(
        self,
        architecture_path: str = "./AandW/esrgan_architecture.json",
        weights_path: str = "./AandW/111case135.hdf5",
        input_size: Tuple[int, int] = (256, 256),
    ) -> None:
        self.architecture_path = architecture_path
        self.weights_path = weights_path
        self.input_size = input_size
        with open(self.architecture_path, "r", encoding="utf-8") as json_file:
            self._model: Model = cast(Model, model_from_json(json_file.read()))
        self._model.load_weights(self.weights_path)

    def predict(self, basepath: str) -> PredictionResult:
        folder_path = os.path.join(basepath, "output_frames_seg")
        images = self._load_images(folder_path)
        raw_predictions = self._predict_raw(images)
        angles = self._aggregate_angles(raw_predictions)
        severity = self._classify_severity(angles)
        back_type = self._determine_back_type(angles)
        return PredictionResult(*angles, severity, back_type)

    def predict_from_image(self, image: Image.Image) -> PredictionResult:
        width, height = self.input_size
        img_resized = image.convert("RGB").resize((width, height), Image.BILINEAR)
        frames = np.asarray(img_resized, dtype=np.float32) / 255.0
        raw_predictions = self._predict_raw(np.expand_dims(frames, axis=0))
        angles = self._aggregate_angles(raw_predictions)
        severity = self._classify_severity(angles)
        back_type = self._determine_back_type(angles)
        return PredictionResult(*angles, severity, back_type)

    def _ensure_model(self):
        if self._model is None:
            with open(self.architecture_path, "r", encoding="utf-8") as json_file:
                self._model = model_from_json(json_file.read())
            self._model.load_weights(self.weights_path)
        return self._model

    def _load_images(self, folder_path: str) -> np.ndarray:
        frames = []
        width, height = self.input_size
        for filename in sorted(os.listdir(folder_path)):
            if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            img_path = os.path.join(folder_path, filename)
            img = Image.open(img_path).convert("RGB")
            img_resized = img.resize((width, height), Image.Resampling.BILINEAR)
            frames.append(np.asarray(img_resized, dtype=np.float32) / 255.0)
        if not frames:
            raise ValueError(f"No images found in {folder_path}")
        return np.stack(frames, axis=0)

    def _predict_raw(self, images: np.ndarray) -> np.ndarray:
        return self._model.predict(images)

    def _aggregate_angles(self, predictions: np.ndarray) -> tuple[float, float, float]:
        main = float(np.mean(predictions[:, 1] * 65))
        secondary = float(np.mean(predictions[:, 0] * 40))
        lumbar = float(np.mean(predictions[:, 2] * 70))
        return main, secondary, lumbar

    @staticmethod
    def _classify_severity(angles: tuple[float, float, float]) -> str:
        max_angle = max(angles)
        if max_angle < 10:
            return "Normal"
        if max_angle <= 24:
            return "Mild"
        if max_angle <= 40:
            return "Moderate"
        return "Severe"

    @staticmethod
    def _determine_back_type(angles: tuple[float, float, float]) -> str:
        pattern_parts = ["Curve" if angle >= 10 else "Straight" for angle in angles]
        pattern = "-".join(pattern_parts)
        description = {
            "Straight-Straight-Straight": "Normal",
            "Straight-Curve-Straight": "Thoracic",
            "Curve-Curve-Straight": "Double Thoracic",
            "Straight-Curve-Curve": "Double major",
            "Curve-Curve-Curve": "Triple curve",
            "Straight-Straight-Curve": "Lumbar",
        }.get(pattern, "Unclassified")
        return f"{pattern} {description}"


def pred(opt) -> tuple[float, float, float, str, str]:
    predictor = ESRGANPredictor()
    result = predictor.predict(opt.basepath)

    return result.as_tuple()


def pred_from_image(image: Image.Image) -> tuple[float, float, float, str, str]:
    predictor = ESRGANPredictor()
    result = predictor.predict_from_image(image)
    return result.as_tuple()
