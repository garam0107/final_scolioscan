FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install base deps first (excluding mediapipe to avoid protobuf conflict with TF 2.10)
RUN pip install --no-cache-dir $(grep -v mediapipe requirements.txt | tr '\n' ' ')
# Install mediapipe without deps to bypass the protobuf<3.20 / >=4.25.3 conflict;
# also install opencv (headless) and pin numpy back to <2 for TF 2.10 compatibility
# Install mediapipe runtime deps manually (bypass protobuf conflict with TF 2.10 by skipping protobuf upgrade)
RUN pip install --no-cache-dir \
        "opencv-python-headless" \
        "numpy<2" \
        "matplotlib" \
        "attrs" \
        "sounddevice" \
        "sentencepiece" \
    && pip install --no-cache-dir --no-deps mediapipe==0.10.18

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
