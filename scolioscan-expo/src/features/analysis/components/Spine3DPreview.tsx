import { useCallback, useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const SPINE_MODEL = require('../../../../assets/glb/spine.glb');

type ExpoGL = WebGLRenderingContext & {
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  endFrameEXP: () => void;
};

type NavigatorWithUserAgent = Navigator & {
  userAgent?: string;
};

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

export default function Spine3DPreview() {
  const aliveRef = useRef(true);
  const frameRef = useRef<number | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const startRotationRef = useRef(0);
  const targetRotationRef = useRef(0);

  useEffect(() => {
    return () => {
      aliveRef.current = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2,
      onPanResponderGrant: () => {
        startRotationRef.current = targetRotationRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        targetRotationRef.current = startRotationRef.current + gesture.dx * 0.012;
      },
    }),
  ).current;

  const onContextCreate = useCallback(async (gl: ExpoGL) => {
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
    modelRef.current = root;

    const render = () => {
      if (!aliveRef.current) return;

      if (modelRef.current) {
        modelRef.current.rotation.y +=
          (targetRotationRef.current - modelRef.current.rotation.y) * 0.18;
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
      frameRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
    </View>
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
