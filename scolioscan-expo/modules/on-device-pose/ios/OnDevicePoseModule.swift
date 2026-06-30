import ExpoModulesCore
import MLKitPoseDetection
import MLKitFaceDetection
import MLKitVision
import UIKit

public class OnDevicePoseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OnDevicePose")

    AsyncFunction("detectPoseOnDevice") { (imageUri: String) async throws -> [String: Any] in
      guard let url = URL(string: imageUri),
            let data = try? Data(contentsOf: url),
            let image = UIImage(data: data) else {
        throw NSError(
          domain: "OnDevicePose",
          code: 1,
          userInfo: [NSLocalizedDescriptionKey: "Failed to load image from URI"]
        )
      }

      let visionImage = VisionImage(image: image)
      visionImage.orientation = image.imageOrientation

      let poseOptions = PoseDetectorOptions()
      poseOptions.detectorMode = .singleImage
      let poseDetector = PoseDetector.poseDetector(options: poseOptions)

      let faceOptions = FaceDetectorOptions()
      faceOptions.performanceMode = .fast
      faceOptions.minFaceSize = 0.1
      let faceDetector = FaceDetector.faceDetector(options: faceOptions)

      async let poseResult = self.processPose(detector: poseDetector, image: visionImage)
      async let faceResult = self.processFaces(detector: faceDetector, image: visionImage)

      let poses = try await poseResult
      let faces = try await faceResult

      return self.buildResponse(
        poses: poses ?? [],
        imageWidth: image.size.width,
        imageHeight: image.size.height,
        faces: faces ?? []
      )
    }
  }

  private func processPose(detector: PoseDetector, image: VisionImage) async throws -> [Pose]? {
  return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[Pose]?, Error>) in
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
    return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[Face]?, Error>) in
      detector.process(image) { results, error in
        if let error = error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: results)
        }
      }
    }
  }

  private func buildResponse(
    poses: [Pose],
    imageWidth: CGFloat,
    imageHeight: CGFloat,
    faces: [Face]
  ) -> [String: Any] {
    let faceCount = faces.count
    let faceDetected = faceCount > 0
    let faceScore = faceDetected ? 1.0 : 0.0

    guard let pose = poses.first, imageWidth > 0, imageHeight > 0 else {
      return [
        "detected": false,
        "landmarks": NSNull(),
        "face_detected": faceDetected,
        "face_score": faceScore,
        "face_count": faceCount
      ]
    }

    let landmarkTypes: [(name: String, type: PoseLandmarkType)] = [
      ("nose", .nose),

      ("leftEyeInner", .leftEyeInner),
      ("leftEye", .leftEye),
      ("leftEyeOuter", .leftEyeOuter),

      ("rightEyeInner", .rightEyeInner),
      ("rightEye", .rightEye),
      ("rightEyeOuter", .rightEyeOuter),

      ("leftEar", .leftEar),
      ("rightEar", .rightEar),

      ("leftMouth", .mouthLeft),
      ("rightMouth", .mouthRight),

      ("leftShoulder", .leftShoulder),
      ("rightShoulder", .rightShoulder),

      ("leftElbow", .leftElbow),
      ("rightElbow", .rightElbow),

      ("leftWrist", .leftWrist),
      ("rightWrist", .rightWrist),

      ("leftPinky", .leftPinkyFinger),
      ("rightPinky", .rightPinkyFinger),

      ("leftIndex", .leftIndexFinger),
      ("rightIndex", .rightIndexFinger),

      ("leftThumb", .leftThumb),
      ("rightThumb", .rightThumb),

      ("leftHip", .leftHip),
      ("rightHip", .rightHip),

      ("leftKnee", .leftKnee),
      ("rightKnee", .rightKnee),

      ("leftAnkle", .leftAnkle),
      ("rightAnkle", .rightAnkle),

      ("leftHeel", .leftHeel),
      ("rightHeel", .rightHeel),

      ("leftFootIndex", .leftToe),
      ("rightFootIndex", .rightToe)
    ]

    let landmarks: [[String: Any]] = landmarkTypes.map { item in
      let landmark = pose.landmark(ofType: item.type)
      let position = landmark.position

      return [
        "name": item.name,
        "x": Double(max(0, min(1, position.x / imageHeight))),
        "y": Double(max(0, min(1, position.y / imageWidth))),
        "z": Double(position.z),
        "visibility": Double(landmark.inFrameLikelihood)
      ]
    }

    let personDetectedVisibility = 0.2
    let detected = landmarks.contains { landmark in
      (landmark["visibility"] as? Double ?? 0.0) >= personDetectedVisibility
    }

    return [
      "detected": detected,
      "landmarks": detected ? landmarks : NSNull(),
      "face_detected": faceDetected,
      "face_score": faceScore,
      "face_count": faceCount
    ]
  }
}