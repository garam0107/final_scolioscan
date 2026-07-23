"""
AIS-API 호환 서버.

기존 백엔드는 POST /ais/angle 로 main_thoracic, secondary_thoracic, lumbar,
severity, back_type 필드를 기대한다. 실제 예측은 predict_dict 안의 새
11포인트 AIS numeric 파이프라인을 사용하고, 이 파일은 기존 응답 형식으로
변환하는 역할만 담당한다.
"""

from typing import Any, Dict

from fastapi import File, HTTPException, UploadFile

from predict_dict.ais_numeric_api_spyder_fix import (
    USE_SEGMENTATION_DEFAULT,
    app,
    read_image_from_bytes,
    run_pipeline_from_pil,
)


CLASSIFICATION_THRESHOLD = 8


def classify_three(a: float, b: float, c: float, threshold: float = CLASSIFICATION_THRESHOLD) -> str:
    """세 Cobb 각도를 기존 앱의 등 유형 문자열로 변환한다."""
    labels = ["Straight" if abs(x) <= threshold else "Bent" for x in (a, b, c)]
    mapping = {
        ("Straight", "Straight", "Straight"): "Normal",
        ("Straight", "Bent", "Straight"): "Thoracic",
        ("Bent", "Bent", "Straight"): "Double Thoracic",
        ("Straight", "Bent", "Bent"): "Double major",
        ("Bent", "Bent", "Bent"): "Triple curve",
        ("Straight", "Straight", "Bent"): "Lumbar",
    }
    return mapping.get(tuple(labels), "Unknown")


def get_severity(max_angle: float) -> str:
    """기존 백엔드/앱에서 사용하는 심각도 문자열로 변환한다."""
    if max_angle < 10:
        return "normal"
    if max_angle < 25:
        return "mild"
    if max_angle < 40:
        return "moderate"
    return "severe"


@app.post("/ais/angle")
async def predict_angle(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    기존 백엔드 호환용 Cobb angle 예측 엔드포인트.

    새 모델 출력 순서:
    - cobb_angles_deg[0]: CA(Prox. T) -> secondary_thoracic
    - cobb_angles_deg[1]: CA(Main. T) -> main_thoracic
    - cobb_angles_deg[2]: CA(TL or Lumbar) -> lumbar
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    try:
        file_bytes = await file.read()
        image = read_image_from_bytes(file_bytes)
        result = run_pipeline_from_pil(
            image,
            use_segmentation=USE_SEGMENTATION_DEFAULT,
            force_cobb=True,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error_code": "PREDICTION_FAILED", "error_message": str(exc)},
        ) from exc

    if int(result.get("cobb_available", 0)) != 1:
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "COBB_UNAVAILABLE",
                "cobb_error_code": result.get("cobb_error_code"),
            },
        )

    cobb_angles = result.get("cobb_angles_deg")
    if not isinstance(cobb_angles, list) or len(cobb_angles) < 3:
        raise HTTPException(
            status_code=500,
            detail={"error_code": "INVALID_COBB_OUTPUT"},
        )

    secondary_thoracic = float(cobb_angles[0])
    main_thoracic = float(cobb_angles[1])
    lumbar = float(cobb_angles[2])
    max_angle = max(abs(secondary_thoracic), abs(main_thoracic), abs(lumbar))

    return {
        "main_thoracic": round(main_thoracic, 2),
        "secondary_thoracic": round(secondary_thoracic, 2),
        "lumbar": round(lumbar, 2),
        "severity": get_severity(max_angle),
        "back_type": classify_three(secondary_thoracic, main_thoracic, lumbar),
    }
