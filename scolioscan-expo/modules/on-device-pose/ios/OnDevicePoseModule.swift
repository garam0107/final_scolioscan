import ExpoModulesCore
import MLKitPoseDetection
import MLKitFaceDetection
import MLKitVision

public class OnDevicePoseModule: Module {
  public override func definition() -> ModuleDefinition {
    Name("OnDevicePose")

    // Expo SDK 50+ async/await syntax
    AsyncFunction("detectPoseOnDevice") { (imageUri: String) async throws -> [String: Any?] in
      guard let url = URL(string: imageUri),
            let data = try? Data(contentsOf: url),
            let image = UIImage(data: data) else {
        throw NSError(domain: "OnDevicePose", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to load image from URI"])
      }

      let visionImage = VisionImage(image: image)
      visionImage.orientation = image.imageOrientation

      // Detector options
      let poseOptions = PoseDetectorOptions()
      poseOptions.detectorMode = .singleImage
      let poseDetector = PoseDetector.poseDetector(options: poseOptions)

      let faceOptions = FaceDetectorOptions()
      faceOptions.performanceMode = .fast
      faceOptions.minFaceSize = 0.1
      let faceDetector = FaceDetector.faceDetector(options: faceOptions)

      // Parallel execution using Swift Concurrency
      async let poseResult = self.processPose(detector: poseDetector, image: visionImage)
      async let faceResult = self.processFaces(detector: faceDetector, image: visionImage)

      let pose = try await poseResult
      let faces = try await faceResult

      return self.buildResponse(
        pose: pose,
        imageWidth: image.size.width,
        imageHeight: image.size.height,
        faces: faces ?? []
      )
    }
  }

  private func processPose(detector: PoseDetector, image: VisionImage) async throws -> Pose? {
    return try await withCheckedThrowingContinuation { continuation in
      detector.process(image) { results, error in
        if let error = error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: results)
        }
      }
    }
  }

  private func processFaces(detector: FaceDetector, image: VisionImage) async throws -> [Face]? {
    return try await withCheckedThrowingContinuation { continuation in
      detector.process(image) { results, error in
        if let error = error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: results)
        }
      }
    }
  }

  private func buildResponse(pose: Pose?, imageWidth: CGFloat, imageHeight: CGFloat, faces: [Face]) -> [String: Any?] {
    guard let pose = pose, imageWidth > 0, imageHeight > 0 else {
      return [
        "detected": false,
        "landmarks": nil,
        "face_detected": false,
        "face_score": 0.0,
        "face_count": 0
      ]
    }

    let landmarkTypes: [PoseLandmarkType] = [
      .nose,
      .leftEyeInner, .leftEye, .leftEyeOuter,
      .rightEyeInner, .rightEye, .rightEyeOuter,
      .leftEar, .rightEar,
      .leftMouth, .rightMouth,
      .leftShoulder, .rightShoulder,
      .leftElbow, .rightElbow,
      .leftWrist, .rightWrist,
      .leftPinky, .rightPinky,
      .leftIndex, .rightIndex,
      .leftThumb, .rightThumb,
      .leftHip, .rightHip,
      .leftKnee, .rightKnee,
      .leftAnkle, .rightAnkle,
      .leftHeel, .rightHeel,
      .leftFootIndex, .rightFootIndex
    ]

    let landmarks: [[String: Double]] = landmarkTypes.map { type in
      let landmark = pose.landmark(ofType: type)
      // iOS ML Kit PoseLandmark has 'position' (2D) and 'position3D' (3D)
      let pos2D = landmark.position
      let pos3D = landmark.position3D
      
      return [
        "x": Double(max(0, min(1, pos2D.x / imageWidth))),
        "y": Double(max(0, min(1, pos2D.y / imageHeight))),
        "z": Double(pos3D.z),
        "visibility": Double(landmark.inFrameLikelihood)
      ]
    }

    let personDetectedVisibility = 0.2
    let detected = landmarks.contains { landmark in
      (landmark["visibility"] ?? 0.0) >= personDetectedVisibility
    }

    let faceCount = faces.count
    let faceDetected = faceCount > 0
    let faceScore = faceDetected ? 1.0 : 0.0

    return [
      "detected": detected,
      "landmarks": detected ? landmarks : nil,
      "face_detected": faceDetected,
      "face_score": faceScore,
      "face_count": faceCount
    ]
  }
}
