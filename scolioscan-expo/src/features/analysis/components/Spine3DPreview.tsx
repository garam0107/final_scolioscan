import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Asset } from 'expo-asset';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import { SpineDeformer, type SpineDeformerMetrics } from '../3d/SpineDeformer';

const SPINE_MODEL = require('../../../../assets/glb/spine.glb');
const INACTIVE_RENDER_DELAY_MS = 250;
const AUTO_ROTATION_SPEED_RADIAN = 0.35;

type ExpoGL = WebGLRenderingContext & {
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  endFrameEXP: () => void;
};

type NavigatorWithUserAgent = Navigator & {
  userAgent?: string;
};

type Spine3DPreviewProps = {
  measurementSet: MeasurementSetResponse | null;
  active: boolean;
  onRenderStateChange?: (ready: boolean) => void;
};

const EMPTY_DEFORMER_METRICS: SpineDeformerMetrics = {
  upperCurvatureDeg: 0,
  mainCurvatureDeg: 0,
  lumbarCurvatureDeg: 0,
  upperTwistDeg: 0,
  mainTwistDeg: 0,
  lumbarTwistDeg: 0,
};

function getDeformerMetrics(measurementSet: MeasurementSetResponse | null): SpineDeformerMetrics {
  const curvature = measurementSet?.curvature;
  const rotation = measurementSet?.rotation;

  return {
    upperCurvatureDeg: curvature?.secondary_thoracic_cobb ?? 0,
    mainCurvatureDeg: curvature?.main_thoracic_cobb ?? 0,
    lumbarCurvatureDeg: curvature?.lumbar_cobb ?? 0,
    upperTwistDeg: rotation?.upper_thoracic_atr ?? 0,
    mainTwistDeg: rotation?.thoracic_atr ?? 0,
    lumbarTwistDeg: rotation?.lumbar_atr ?? 0,
  };
}

function ensureThreeNavigatorUserAgent() {
  const fallbackUserAgent = 'ReactNative';
  const currentNavigator = globalThis.navigator as NavigatorWithUserAgent | undefined;

  if (!currentNavigator) {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: fallbackUserAgent },
      configurable: true,
    });
    return;
  }

  if (typeof currentNavigator.userAgent !== 'string') {
    Object.defineProperty(currentNavigator, 'userAgent', {
      value: fallbackUserAgent,
      configurable: true,
    });
  }
}

function disposeObject3D(object: THREE.Object3D | null) {
  if (!object) return;

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry?.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else {
      child.material?.dispose();
    }
  });
}

export default function Spine3DPreview({
  measurementSet,
  active,
  onRenderStateChange,
}: Spine3DPreviewProps) {
  const aliveRef = useRef(true);
  const frameRef = useRef<number | null>(null);
  const inactiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const deformerRef = useRef<SpineDeformer | null>(null);
  const metricsRef = useRef<SpineDeformerMetrics>(EMPTY_DEFORMER_METRICS);
  const lastFrameTimeRef = useRef<number | null>(null);
  const contextIdRef = useRef(0);
  const activeRef = useRef(active);
  const autoRotationPausedRef = useRef(false);
  const [autoRotationPaused, setAutoRotationPaused] = useState(false);

  const stopCurrentContext = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (inactiveTimeoutRef.current !== null) {
      clearTimeout(inactiveTimeoutRef.current);
      inactiveTimeoutRef.current = null;
    }

    renderRef.current = null;
    deformerRef.current?.reset();
    deformerRef.current = null;
    disposeObject3D(modelRef.current);
    modelRef.current = null;
    rendererRef.current?.dispose();
    rendererRef.current = null;
    lastFrameTimeRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      aliveRef.current = false;
      contextIdRef.current += 1;
      stopCurrentContext();
    };
  }, [stopCurrentContext]);

  useEffect(() => {
    activeRef.current = active;

    if (active) {
      lastFrameTimeRef.current = null;
      // 분석 화면으로 다시 돌아올 때는 이전 회전 상태를 이어가지 않고 정면에서 다시 시작한다.
      if (modelRef.current) {
        modelRef.current.rotation.y = 0;
      }
      autoRotationPausedRef.current = false;
      setAutoRotationPaused(false);

      if (inactiveTimeoutRef.current !== null) {
        clearTimeout(inactiveTimeoutRef.current);
        inactiveTimeoutRef.current = null;
      }

      if (renderRef.current) {
        frameRef.current = requestAnimationFrame(renderRef.current);
      }
    }
  }, [active]);

  useEffect(() => {
    const metrics = getDeformerMetrics(measurementSet);

    metricsRef.current = metrics;
    deformerRef.current?.setMetrics(metrics);
  }, [measurementSet]);

  const toggleAutoRotation = useCallback(() => {
    setAutoRotationPaused((current) => {
      const next = !current;
      autoRotationPausedRef.current = next;
      return next;
    });
  }, []);

  const onContextCreate = useCallback(async (gl: ExpoGL) => {
    const contextId = contextIdRef.current + 1;
    contextIdRef.current = contextId;
    stopCurrentContext();
    onRenderStateChange?.(false);

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    const canvas = {
      width,
      height,
      style: {},
      clientWidth: width,
      clientHeight: height,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      getContext: () => gl,
    };

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas as unknown as HTMLCanvasElement,
      context: gl,
      antialias: true,
      alpha: true,
    });
    rendererRef.current = renderer;

    renderer.setSize(width, height);
    renderer.setClearColor(0x25272d, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.01, 100);
    camera.position.set(0, 0.05, 5);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1.7));

    const light = new THREE.DirectionalLight(0xffffff, 2.2);
    light.position.set(2, 3, 4);
    scene.add(light);

    const asset = Asset.fromModule(SPINE_MODEL);
    await asset.downloadAsync();
    ensureThreeNavigatorUserAgent();
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(asset.localUri ?? asset.uri);

    if (!aliveRef.current || contextIdRef.current !== contextId) {
      renderer.dispose();
      disposeObject3D(gltf.scene);
      return;
    }

    const root = gltf.scene;
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    // 오른쪽 모델 영역 안에서 척추가 중앙에 오도록 크기와 중심을 맞춥니다.
    root.scale.setScalar(2.6 / maxSize);

    const scaledBox = new THREE.Box3().setFromObject(root);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

    root.position.set(
      -scaledCenter.x,
      -scaledCenter.y,
      -scaledCenter.z,
    );

    root.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#F1F0EA',
          roughness: 0.58,
          metalness: 0.02,
        });
      }
    });

    scene.add(root);
    // 새 GL context에서 모델을 다시 붙일 때는 항상 처음 방향에서 자동 회전을 시작한다.
    root.rotation.y = 0;
    modelRef.current = root;
    deformerRef.current = new SpineDeformer(root);
    deformerRef.current.setMetrics(metricsRef.current);

    let firstFrameLogged = false;

    const render = () => {
      if (!aliveRef.current || contextIdRef.current !== contextId) return;

      const now = globalThis.performance?.now?.() ?? Date.now();
      const deltaSeconds = lastFrameTimeRef.current === null
        ? 1 / 60
        : Math.min(0.05, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      if (!activeRef.current) {
        inactiveTimeoutRef.current = setTimeout(() => {
          inactiveTimeoutRef.current = null;
          if (aliveRef.current && contextIdRef.current === contextId) {
            frameRef.current = requestAnimationFrame(render);
          }
        }, INACTIVE_RENDER_DELAY_MS);
        return;
      }

      if (modelRef.current && !autoRotationPausedRef.current) {
        modelRef.current.rotation.y += AUTO_ROTATION_SPEED_RADIAN * deltaSeconds;
      }

      deformerRef.current?.update(deltaSeconds);
      try {
        renderer.render(scene, camera);
        gl.endFrameEXP();
        if (!firstFrameLogged) {
          firstFrameLogged = true;
          onRenderStateChange?.(true);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[Spine3DPreview] render skipped after GL context change', error);
        }
        return;
      }

      if (aliveRef.current && contextIdRef.current === contextId) {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    renderRef.current = render;
    render();
  }, [onRenderStateChange, stopCurrentContext]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !autoRotationPaused }}
      accessibilityLabel={autoRotationPaused ? '3D 모델 자동 회전 시작' : '3D 모델 자동 회전 멈춤'}
      style={styles.container}
      onPress={toggleAutoRotation}
    >
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  glView: {
    flex: 1,
  },
});
