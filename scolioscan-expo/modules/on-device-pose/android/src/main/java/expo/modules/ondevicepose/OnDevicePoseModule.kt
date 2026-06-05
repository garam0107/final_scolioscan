package expo.modules.ondevicepose

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class OnDevicePoseModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("OnDevicePose")

    AsyncFunction("detectPoseOnDevice") { imageUri: String, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val image = InputImage.fromFilePath(context, Uri.parse(imageUri))
      val options = PoseDetectorOptions.Builder()
        .setDetectorMode(PoseDetectorOptions.SINGLE_IMAGE_MODE)
        .build()
      val poseDetector = PoseDetection.getClient(options)
      val faceOptions = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setMinFaceSize(0.1f)
        .build()
      val faceDetector = FaceDetection.getClient(faceOptions)

      poseDetector.process(image)
        .addOnSuccessListener { pose ->
          faceDetector.process(image)
            .addOnSuccessListener { faces ->
              promise.resolve(buildResponse(pose, image.width, image.height, faces))
              poseDetector.close()
              faceDetector.close()
            }
            .addOnFailureListener { error ->
              poseDetector.close()
              faceDetector.close()
              promise.reject("ERR_ON_DEVICE_FACE", error.message ?: "온디바이스 얼굴 분석에 실패했습니다.", error)
            }
        }
        .addOnFailureListener { error ->
          poseDetector.close()
          faceDetector.close()
          promise.reject("ERR_ON_DEVICE_POSE", error.message ?: "온디바이스 포즈 분석에 실패했습니다.", error)
        }
    }
  }

  private fun buildResponse(pose: Pose, imageWidth: Int, imageHeight: Int, faces: List<Face>): Map<String, Any?> {
    val landmarks = landmarkTypes.map { type ->
      val landmark = pose.getPoseLandmark(type)
      toLandmarkMap(landmark, imageWidth, imageHeight)
    }
    val detected = landmarks.any { landmark ->
      (landmark["visibility"] as Double) >= PERSON_DETECTED_VISIBILITY
    }
    val faceCount = faces.size
    val faceDetected = faceCount > 0
    val faceScore = if (faceDetected) 1.0 else 0.0

    return mapOf(
      "detected" to detected,
      "landmarks" to if (detected) landmarks else null,
      "face_detected" to faceDetected,
      "face_score" to faceScore,
      "face_count" to faceCount,
    )
  }

  private fun toLandmarkMap(landmark: PoseLandmark?, imageWidth: Int, imageHeight: Int): Map<String, Double> {
    if (landmark == null || imageWidth <= 0 || imageHeight <= 0) {
      return emptyLandmark()
    }

    val position = landmark.position
    val position3D = landmark.position3D

    // 기존 서버 응답과 맞추기 위해 이미지 좌표를 0..1 정규화 좌표로 변환한다.
    return mapOf(
      "x" to clamp01(position.x.toDouble() / imageWidth.toDouble()),
      "y" to clamp01(position.y.toDouble() / imageHeight.toDouble()),
      "z" to position3D.z.toDouble(),
      "visibility" to landmark.inFrameLikelihood.toDouble(),
    )
  }

  private fun emptyLandmark(): Map<String, Double> {
    return mapOf(
      "x" to 0.0,
      "y" to 0.0,
      "z" to 0.0,
      "visibility" to 0.0,
    )
  }

  private fun clamp01(value: Double): Double {
    return value.coerceIn(0.0, 1.0)
  }

  companion object {
    private const val PERSON_DETECTED_VISIBILITY = 0.2

    private val landmarkTypes = listOf(
      PoseLandmark.NOSE,
      PoseLandmark.LEFT_EYE_INNER,
      PoseLandmark.LEFT_EYE,
      PoseLandmark.LEFT_EYE_OUTER,
      PoseLandmark.RIGHT_EYE_INNER,
      PoseLandmark.RIGHT_EYE,
      PoseLandmark.RIGHT_EYE_OUTER,
      PoseLandmark.LEFT_EAR,
      PoseLandmark.RIGHT_EAR,
      PoseLandmark.LEFT_MOUTH,
      PoseLandmark.RIGHT_MOUTH,
      PoseLandmark.LEFT_SHOULDER,
      PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_ELBOW,
      PoseLandmark.RIGHT_ELBOW,
      PoseLandmark.LEFT_WRIST,
      PoseLandmark.RIGHT_WRIST,
      PoseLandmark.LEFT_PINKY,
      PoseLandmark.RIGHT_PINKY,
      PoseLandmark.LEFT_INDEX,
      PoseLandmark.RIGHT_INDEX,
      PoseLandmark.LEFT_THUMB,
      PoseLandmark.RIGHT_THUMB,
      PoseLandmark.LEFT_HIP,
      PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_KNEE,
      PoseLandmark.RIGHT_KNEE,
      PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_HEEL,
      PoseLandmark.RIGHT_HEEL,
      PoseLandmark.LEFT_FOOT_INDEX,
      PoseLandmark.RIGHT_FOOT_INDEX,
    )
  }
}
