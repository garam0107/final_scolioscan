# Measure2D 가이드라인 판정 알고리즘

이 문서는 `measure2d` 화면에서 사용자가 가이드라인에 맞게 섰는지 판단하는 현재 로직을 설명한다. 판정은 화면에 표시되는 SVG 실루엣 자체를 이미지 분석하는 방식이 아니라, 화면 가이드의 정규화 좌표와 `/ais/landmarks` API가 반환한 MediaPipe Pose 랜드마크 좌표를 비교하는 방식이다.

## 전체 흐름

1. `Measure2DScreen.tsx`가 카메라 영역의 실제 화면 크기를 `stageLayout`으로 저장한다.
2. `guidelineGeometry.ts`의 `createGuidelineGeometry()`가 화면 크기를 기준으로 가이드라인 위치와 크기를 계산한다.
3. 사용자가 촬영 버튼을 누르면 `useMeasure2D.ts`가 사진을 촬영한다.
4. `landmarkApi.ts`가 촬영 이미지를 `/ais/landmarks`로 업로드한다.
5. 서버가 MediaPipe Pose 랜드마크 33개를 반환한다.
6. `landmarkRules.ts`의 `evaluateLandmarks()`가 랜드마크와 가이드 정보를 비교한다.
7. `aligned`가 `true`이면 척추측만 분석 API 호출 단계로 넘어간다.

## 가이드라인 좌표 생성

파일: `domain/guidelineGeometry.ts`

가이드라인은 카메라 화면 전체를 기준으로 계산된다.

```ts
const BASE_W = 237;
const BASE_H = 588;
const GUIDE_WIDTH_RATIO = 0.72;
```

`GUIDE_WIDTH_RATIO`는 화면 너비 대비 가이드라인 너비다. 현재 값 `0.72`는 카메라 화면 너비의 72%를 가이드라인 너비로 사용한다. 높이는 원본 SVG 비율 `588 / 237`을 유지해서 계산한다.

```ts
const guideWidth = previewWidth * GUIDE_WIDTH_RATIO;
const guideHeight = guideWidth * (BASE_H / BASE_W);
const guideX = (previewWidth - guideWidth) / 2;
const guideY = previewHeight - guideHeight;
```

가이드는 가로 중앙에 배치되고, 아래쪽 바닥에 붙는 구조다. 이후 `buildGuideRect()`가 이 값을 0~1 범위의 정규화 좌표로 바꾼다.

```ts
{
  left: guideX / previewWidth,
  top: guideY / previewHeight,
  right: (guideX + guideWidth) / previewWidth,
  bottom: (guideY + guideHeight) / previewHeight,
}
```

## 기준점 생성

파일: `domain/guidelineGeometry.ts`

거리 판정에는 가이드 영역 안의 기준점 4개를 사용한다.

```ts
const LEFT_SHOULDER_X_RATIO = 0.24;
const RIGHT_SHOULDER_X_RATIO = 0.76;
const SHOULDER_Y_RATIO = 0.37;
const LEFT_HIP_X_RATIO = 0.33;
const RIGHT_HIP_X_RATIO = 0.67;
const HIP_Y_RATIO = 0.72;
```

이 기준점은 현재 최종 통과 여부를 직접 결정하지는 않는다. 대신 감지된 사람의 어깨 너비와 몸통 높이가 가이드 기준 크기와 비교될 때 사용된다.

## 사용하는 MediaPipe 랜드마크

파일: `domain/landmarkRules.ts`

현재 판정은 아래 랜드마크만 사용한다.

| 이름 | MediaPipe index | 용도 |
| --- | ---: | --- |
| 코 | 0 | 얼굴 노출 점수 |
| 왼쪽 눈 | 2 | 얼굴 노출 점수 |
| 오른쪽 눈 | 5 | 얼굴 노출 점수 |
| 왼쪽 귀 | 7 | 얼굴 노출 점수 |
| 오른쪽 귀 | 8 | 얼굴 노출 점수 |
| 왼쪽 어깨 | 11 | 가시성, 방향, 거리, 영역 판정 |
| 오른쪽 어깨 | 12 | 가시성, 방향, 거리, 영역 판정 |
| 왼쪽 골반 | 23 | 가시성, 거리, 영역 판정 |
| 오른쪽 골반 | 24 | 가시성, 거리, 영역 판정 |

## 1단계: 가시성 판정

어깨와 골반 4점이 모두 충분히 보이는지 먼저 확인한다.

```ts
const MIN_VISIBILITY = 0.6;
```

아래 네 점 중 하나라도 visibility가 `0.6` 미만이면 실패한다.

- 왼쪽 어깨
- 오른쪽 어깨
- 왼쪽 골반
- 오른쪽 골반

실패 문구:

```txt
어깨와 골반이 가이드 안에 보이도록 서주세요.
```

## 2단계: 후면/전면 판정

후면 촬영을 유도하기 위해 어깨 좌표 순서와 얼굴 visibility를 같이 본다.

```ts
const BEHIND_SHOULDER_DELTA = 0.02;
const FACE_VISIBLE_FRONT_THRESHOLD = 0.55;
const FACE_VISIBLE_BACK_THRESHOLD = 0.3;
```

먼저 어깨 좌표 순서를 확인한다.

```ts
rightShoulder.x - leftShoulder.x > 0.02
```

그리고 코, 눈, 귀 랜드마크 visibility 평균을 `faceScore`로 계산한다.

현재 분류 규칙은 다음과 같다.

| 조건 | 결과 |
| --- | --- |
| 어깨 순서가 후면이고 faceScore <= 0.3 | 후면 |
| 어깨 순서가 후면이고 faceScore < 0.55 | 후면 |
| 어깨 순서가 후면이 아니고 faceScore >= 0.55 | 전면 |
| 그 외 | 판정불가 |

`direction`이 `전면`이면 실패한다.

실패 문구:

```txt
뒷모습이 보이게 서주세요.
```

주의할 점은 `판정불가`는 실패로 처리하지 않는다는 것이다. 방향을 확실히 전면이라고 판단한 경우만 막는다.

## 3단계: 거리 판정

거리 판정은 감지된 사람의 크기와 가이드 기준 크기의 비율을 비교한다.

```ts
const DIST_TOO_CLOSE = 1.45;
const DIST_TOO_FAR = 0.58;
```

계산에 사용하는 값은 두 가지다.

1. 어깨 너비 비율
2. 몸통 높이 비율

어깨 너비 비율:

```ts
detectedShoulderWidth / guideShoulderWidth
```

몸통 높이 비율:

```ts
detectedTorsoHeight / guideTorsoHeight
```

최종 거리 스케일:

```ts
scale = (shoulderRatio + torsoRatio) / 2;
```

거리 결과는 다음과 같이 결정된다.

| 조건 | 결과 | 사용자 안내 |
| --- | --- | --- |
| scale > 1.45 | 가까움 | 조금 더 멀리 떨어져주세요. |
| scale < 0.58 | 멀음 | 조금 더 가까이 와주세요. |
| 그 외 | 적정 | 없음 |

즉 `distanceScale`이 `0.58` 이상 `1.45` 이하이면 거리 기준은 통과한다.

## 4단계: 가이드 영역 포함 판정

기존에는 어깨와 골반 4점을 각각 가이드 기준점에 맞추는 방식이었다. 현재는 더 유연하게, 어깨와 골반이 가이드 영역 안에 대체로 들어왔는지를 본다.

```ts
const GUIDE_AREA_PADDING_X = 0.06;
const GUIDE_AREA_PADDING_Y = 0.04;
const GUIDE_AREA_SCORE_THRESHOLD = 75;
```

먼저 실제 가이드 rect를 좌우 0.06, 상하 0.04만큼 확장한다.

```ts
{
  left: rect.left - 0.06,
  top: rect.top - 0.04,
  right: rect.right + 0.06,
  bottom: rect.bottom + 0.04,
}
```

각 값은 `0~1` 범위를 넘지 않게 보정한다. 이후 아래 네 점이 확장된 가이드 영역 안에 들어오는지 센다.

- 왼쪽 어깨
- 오른쪽 어깨
- 왼쪽 골반
- 오른쪽 골반

점수는 다음 공식으로 계산한다.

```ts
score = Math.round((insideCount / 4) * 100);
```

| insideCount | score | 결과 |
| ---: | ---: | --- |
| 4 | 100 | 통과 |
| 3 | 75 | 통과 |
| 2 | 50 | 실패 |
| 1 | 25 | 실패 |
| 0 | 0 | 실패 |

실패 문구:

```txt
몸이 가이드라인 안에 들어오도록 서주세요.
```

## 최종 통과 조건

최종 통과 조건은 다음과 같다.

```ts
aligned = reasons.length === 0 && score >= 75;
```

즉 아래 조건을 모두 만족해야 한다.

1. 어깨와 골반 4점이 visibility 0.6 이상이어야 한다.
2. 전면으로 판정되지 않아야 한다.
3. 거리 스케일이 0.58 이상 1.45 이하이어야 한다.
4. 어깨/골반 4점 중 3점 이상이 확장된 가이드 영역 안에 있어야 한다.

## 로그 해석 방법

현재 디버그 로그는 다음 순서로 찍힌다.

```txt
[measure2d] 촬영 결과
[measure2d] /ais/landmarks 요청 시작
[measure2d] /ais/landmarks 응답 상태
[measure2d] /ais/landmarks 분석 결과
[measure2d] 감지 랜드마크 (11,12,23,24)
[measure2d] 가이드 기준 좌표
[measure2d] 자세 판정 요약
[measure2d] 최종 판정 결과
```

주요 로그 필드:

| 필드 | 의미 |
| --- | --- |
| `detected` | MediaPipe가 사람을 찾았는지 여부 |
| `landmarkCount` | 반환된 랜드마크 개수. 정상은 33 |
| `distance` | 가까움, 적정, 멀음, 판정불가 |
| `distanceScale` | 감지된 사람 크기와 가이드 기준 크기의 비율 |
| `guideAreaInsideCount` | 어깨/골반 4점 중 영역 안에 들어온 개수 |
| `guideAreaScore` | 영역 포함 점수 |
| `direction` | 후면, 전면, 판정불가 |
| `faceVisibilityScore` | 얼굴 랜드마크 visibility 평균 |
| `guideAligned` | 최종 판정 결과 |

예시:

```txt
distance: "적정"
guideAreaInsideCount: 4
guideAreaScore: 100
guideAligned: "일치"
```

이 경우 가이드 판정은 통과다.

```txt
distance: "멀음"
guideAreaScore: 100
reasons: ["조금 더 가까이 와주세요."]
```

이 경우 몸은 가이드 영역 안에 들어왔지만, 감지된 사람 크기가 가이드 기준보다 너무 작아서 실패한 것이다.

## 튜닝 포인트

촬영 기준을 더 쉽게 만들고 싶을 때 조정할 수 있는 값은 다음과 같다.

| 값 | 파일 | 효과 |
| --- | --- | --- |
| `GUIDE_WIDTH_RATIO` | `guidelineGeometry.ts` | 화면에 보이는 가이드 크기와 기준 스케일을 같이 키우거나 줄인다. |
| `GUIDE_AREA_PADDING_X` | `landmarkRules.ts` | 좌우로 가이드 영역 판정을 더 넓힌다. |
| `GUIDE_AREA_PADDING_Y` | `landmarkRules.ts` | 위아래로 가이드 영역 판정을 더 넓힌다. |
| `GUIDE_AREA_SCORE_THRESHOLD` | `landmarkRules.ts` | 영역 안에 들어와야 하는 점수 기준을 바꾼다. |
| `DIST_TOO_CLOSE` | `landmarkRules.ts` | 너무 가까운 촬영을 막는 기준을 바꾼다. |
| `DIST_TOO_FAR` | `landmarkRules.ts` | 너무 먼 촬영을 막는 기준을 바꾼다. |
| `MIN_VISIBILITY` | `landmarkRules.ts` | 어깨/골반이 보인다고 판단하는 visibility 기준을 바꾼다. |

튜닝 예시는 다음과 같다.

| 목표 | 변경 방향 |
| --- | --- |
| 계속 가까이 오라는 안내가 뜸 | `DIST_TOO_FAR`를 낮춘다. |
| 계속 멀리 가라는 안내가 뜸 | `DIST_TOO_CLOSE`를 높인다. |
| 몸이 가이드 안에 있는데 영역 실패가 뜸 | `GUIDE_AREA_PADDING_X/Y`를 높인다. |
| 너무 쉽게 통과함 | `GUIDE_AREA_SCORE_THRESHOLD`를 100으로 올리거나 padding을 낮춘다. |
| 가이드가 너무 큼 | `GUIDE_WIDTH_RATIO`를 0.68~0.70으로 낮춘다. |

## 현재 한계

현재 프론트는 카메라 preview 화면 기준의 가이드 좌표와 서버가 반환한 촬영 이미지 기준 MediaPipe 좌표를 직접 비교한다. 카메라 preview가 실제 촬영 이미지와 다른 비율로 crop되면 좌표가 완전히 일치하지 않을 수 있다.

이 한계 때문에 현재 로직은 정확한 점 위치 일치보다 넓은 영역 포함과 완화된 거리 기준을 사용한다. 장기적으로 더 정확하게 만들려면 서버가 이미지 크기, EXIF 회전 적용 후 크기, preview crop 보정 정보를 함께 반환하거나, 프론트가 CameraView preview와 실제 촬영 이미지 사이의 crop/scale 변환을 계산해야 한다.
