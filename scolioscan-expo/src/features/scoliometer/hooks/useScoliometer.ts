import {
  DeviceMotion,
  Gyroscope,
  type DeviceMotionMeasurement,
  type GyroscopeMeasurement,
} from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ScoliometerMode = 'landscape' | 'flat';

type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type FlatOffset = {
  x: number;
  y: number;
};

type Calibration = {
  landscape: number;
  flat: FlatOffset;
};

type ScoliometerState = {
  mode: ScoliometerMode;
  angle: number;
  surfaceAngle: number;
  bubbleX: number;
  bubbleY: number;
  bubbleScale: number;
  isSupported: boolean;
  isReady: boolean;
};

const DEVICE_MOTION_INTERVAL = 40;
const GYROSCOPE_INTERVAL = 40;
const FILTER_ALPHA = 0.16;
const EPSILON = 0.0001;
// 정규화된 z축 값이 이 기준보다 크면 휴대폰이 바닥과 평행한 평면 상태로 본다.
const FLAT_ENTER_THRESHOLD = 0.88;
// 평면 상태에서 가로 상태로 너무 자주 깜빡이지 않게 나갈 때는 더 낮은 기준을 쓴다.
const FLAT_EXIT_THRESHOLD = 0.76;
// 실제 측정 각도보다 화면의 흰색 경계가 너무 많이 기울지 않도록 제한한다.
const SURFACE_ANGLE_LIMIT = 34;

const INITIAL_STATE: ScoliometerState = {
  mode: 'landscape',
  angle: 0,
  surfaceAngle: 0,
  bubbleX: 0,
  bubbleY: 0,
  bubbleScale: 1,
  isSupported: true,
  isReady: false,
};

function toDegrees(radian: number) {
  return (radian * 180) / Math.PI;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lowPass(previous: Vector3 | null, next: Vector3): Vector3 {
  // 센서 값 흔들림을 줄이기 위해 이전 중력 벡터와 새 값을 부드럽게 섞는다.
  if (!previous) {
    return next;
  }

  return {
    x: previous.x + (next.x - previous.x) * FILTER_ALPHA,
    y: previous.y + (next.y - previous.y) * FILTER_ALPHA,
    z: previous.z + (next.z - previous.z) * FILTER_ALPHA,
  };
}

function toGravityVector(event: DeviceMotionMeasurement): Vector3 | null {
  // 기기별 가속도 단위 차이를 없애기 위해 중력 벡터를 -1~1 범위로 정규화한다.
  const sample = event.accelerationIncludingGravity;

  if (!sample) {
    return null;
  }

  if (
    typeof sample.x !== 'number' ||
    typeof sample.y !== 'number' ||
    typeof sample.z !== 'number'
  ) {
    return null;
  }

  const magnitude = Math.sqrt(sample.x ** 2 + sample.y ** 2 + sample.z ** 2);

  if (magnitude <= EPSILON) {
    return null;
  }

  // DeviceMotion 값은 기기마다 약 9.8 단위로 들어오므로 -1~1 범위로 정규화해서 판별한다.
  return {
    x: sample.x / magnitude,
    y: sample.y / magnitude,
    z: sample.z / magnitude,
  };
}

function getGyroscopeMagnitude(event: GyroscopeMeasurement) {
  return Math.sqrt(event.x ** 2 + event.y ** 2 + event.z ** 2);
}

function resolveMode(gravity: Vector3, currentMode: ScoliometerMode): ScoliometerMode {
  // 평면/가로 모드가 자주 튀지 않도록 진입 기준과 이탈 기준을 다르게 둔다.
  const absZ = Math.abs(gravity.z);

  // 평면과 가로만 사용한다. 세로로 세운 경우도 별도 모드 없이 가로 화면으로 유지한다.
  if (currentMode === 'flat') {
    return absZ >= FLAT_EXIT_THRESHOLD ? 'flat' : 'landscape';
  }

  return absZ >= FLAT_ENTER_THRESHOLD ? 'flat' : 'landscape';
}

function getLandscapeAngle(gravity: Vector3) {
  // 가로 모드에서는 좌우 기울기를 부호 있는 각도로 계산한다.
  // 가로 측정의 핵심 각도다. 실기기에서 좌우 방향이 반대면 이 값의 부호를 바꾸면 된다.
  return toDegrees(Math.atan2(gravity.y, Math.abs(gravity.x) + EPSILON));
}

function getFlatSignedAngle(gravity: Vector3, offset: FlatOffset) {
  // 평면 모드에서는 보정값을 뺀 뒤 중심에서 벗어난 정도를 각도로 변환한다.
  const adjustedX = gravity.x - offset.x;
  const adjustedY = gravity.y - offset.y;

  return toDegrees(
    Math.atan2(Math.sqrt(adjustedX ** 2 + adjustedY ** 2), Math.abs(gravity.z) + EPSILON),
  );
}

export function useScoliometer() {
  const [state, setState] = useState<ScoliometerState>(INITIAL_STATE);

  const gravityRef = useRef<Vector3 | null>(null);
  const latestGravityRef = useRef<Vector3 | null>(null);
  const gyroscopeRef = useRef(0);
  const modeRef = useRef<ScoliometerMode>('landscape');
  const candidateModeRef = useRef<ScoliometerMode>('landscape');
  const candidateCountRef = useRef(0);
  const calibrationRef = useRef<Calibration>({
    landscape: 0,
    flat: {
      x: 0,
      y: 0,
    },
  });

  const calibrate = useCallback(() => {
    // 현재 자세를 기준점으로 저장해 이후 측정값에서 보정값을 빼준다.
    const gravity = latestGravityRef.current;

    if (!gravity) {
      return;
    }

    if (modeRef.current === 'flat') {
      // 평면 보정은 현재 x/y 기울기를 기준점으로 저장한다.
      calibrationRef.current = {
        ...calibrationRef.current,
        flat: {
          x: gravity.x,
          y: gravity.y,
        },
      };
      return;
    }

    // 가로 보정은 현재 가로 각도를 0도로 저장한다.
    calibrationRef.current = {
      ...calibrationRef.current,
      landscape: getLandscapeAngle(gravity),
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let motionSubscription: { remove: () => void } | null = null;
    let gyroscopeSubscription: { remove: () => void } | null = null;

    async function subscribe() {
      const [motionAvailable, gyroscopeAvailable] = await Promise.all([
        DeviceMotion.isAvailableAsync(),
        Gyroscope.isAvailableAsync(),
      ]);

      if (!isMounted) {
        return;
      }

      if (!motionAvailable || !gyroscopeAvailable) {
        setState((previous) => ({
          ...previous,
          isSupported: false,
          isReady: false,
        }));
        return;
      }

      DeviceMotion.setUpdateInterval(DEVICE_MOTION_INTERVAL);
      Gyroscope.setUpdateInterval(GYROSCOPE_INTERVAL);

      gyroscopeSubscription = Gyroscope.addListener((event) => {
        gyroscopeRef.current = getGyroscopeMagnitude(event);
      });

      motionSubscription = DeviceMotion.addListener((event) => {
        // DeviceMotion은 실제 각도 계산, Gyroscope는 모드 전환 안정화에 사용한다.
        const nextGravity = toGravityVector(event);

        if (!nextGravity) {
          return;
        }

        const gravity = lowPass(gravityRef.current, nextGravity);
        gravityRef.current = gravity;
        latestGravityRef.current = gravity;

        const nextMode = resolveMode(gravity, modeRef.current);

        if (nextMode !== modeRef.current) {
          if (candidateModeRef.current === nextMode) {
            candidateCountRef.current += 1;
          } else {
            candidateModeRef.current = nextMode;
            candidateCountRef.current = 1;
          }

          // 손 움직임이 클 때는 모드 전환을 조금 늦춰 화면 흔들림을 줄인다.
          const requiredCount = gyroscopeRef.current > 0.5 ? 5 : 3;

          if (candidateCountRef.current >= requiredCount) {
            modeRef.current = nextMode;
            candidateCountRef.current = 0;
          }
        } else {
          candidateModeRef.current = nextMode;
          candidateCountRef.current = 0;
        }

        const mode = modeRef.current;
        const flatOffset = calibrationRef.current.flat;
        // 평면은 절대 기울기 크기, 가로는 좌우 signed angle을 표시한다.
        const angle = mode === 'flat'
          ? getFlatSignedAngle(gravity, flatOffset)
          : getLandscapeAngle(gravity) - calibrationRef.current.landscape;

        setState({
          mode,
          angle: clamp(angle, -89.9, 89.9),
          surfaceAngle: clamp(angle * 1.15, -SURFACE_ANGLE_LIMIT, SURFACE_ANGLE_LIMIT),
          // 평면 모드에서 두 원이 벌어지는 방향과 거리를 정한다. 숫자를 키우면 더 민감하게 벌어진다.
          bubbleX: clamp((gravity.x - flatOffset.x) * 160, -100, 100),
          bubbleY: clamp(-(gravity.y - flatOffset.y) * 160, -100, 100),
          bubbleScale: 1,
          isSupported: true,
          isReady: true,
        });
      });
    }

    void subscribe();

    return () => {
      isMounted = false;
      motionSubscription?.remove();
      gyroscopeSubscription?.remove();
    };
  }, []);

  return {
    ...state,
    calibrate,
  };
}
