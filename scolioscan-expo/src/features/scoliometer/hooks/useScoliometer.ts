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
const FLAT_ENTER_THRESHOLD = 0.88;
const FLAT_EXIT_THRESHOLD = 0.76;
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
  const absZ = Math.abs(gravity.z);

  if (currentMode === 'flat') {
    return absZ >= FLAT_EXIT_THRESHOLD ? 'flat' : 'landscape';
  }

  return absZ >= FLAT_ENTER_THRESHOLD ? 'flat' : 'landscape';
}

function getLandscapeAngle(gravity: Vector3) {
  return toDegrees(Math.atan2(gravity.y, Math.abs(gravity.x) + EPSILON));
}

function getFlatSignedAngle(gravity: Vector3, offset: FlatOffset) {
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
    const gravity = latestGravityRef.current;

    if (!gravity) {
      return;
    }

    if (modeRef.current === 'flat') {
      calibrationRef.current = {
        ...calibrationRef.current,
        flat: {
          x: gravity.x,
          y: gravity.y,
        },
      };
      return;
    }

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
        const angle = mode === 'flat'
          ? getFlatSignedAngle(gravity, flatOffset)
          : getLandscapeAngle(gravity) - calibrationRef.current.landscape;

        setState({
          mode,
          angle: clamp(angle, -89.9, 89.9),
          surfaceAngle: clamp(angle * 1.15, -SURFACE_ANGLE_LIMIT, SURFACE_ANGLE_LIMIT),
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
