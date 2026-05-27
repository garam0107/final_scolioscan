import * as THREE from 'three';

type AxisName = 'x' | 'y' | 'z';

export type SpineDeformerMetrics = {
  upperCurvatureDeg: number;
  mainCurvatureDeg: number;
  lumbarCurvatureDeg: number;
  upperTwistDeg: number;
  mainTwistDeg: number;
  lumbarTwistDeg: number;
};

type SpineDeformerOptions = {
  verticalAxis?: AxisName;
  lateralAxis?: AxisName;
  twistAxis?: AxisName;
  tiltAxis?: AxisName;
  curveDirection?: 1 | -1;
  maxCurvatureDeg?: number;
  maxTwistDeg?: number;
  maxLateralRatio?: number;
  maxTiltDeg?: number;
  twistScale?: number;
  damping?: number;
};

type VertebraRecord = {
  name: string;
  pivot: THREE.Object3D;
  t: number;
  basePosition: THREE.Vector3;
  baseQuaternion: THREE.Quaternion;
  targetPosition: THREE.Vector3;
  targetQuaternion: THREE.Quaternion;
};

const DEFAULT_METRICS: SpineDeformerMetrics = {
  upperCurvatureDeg: 0,
  mainCurvatureDeg: 0,
  lumbarCurvatureDeg: 0,
  upperTwistDeg: 0,
  mainTwistDeg: 0,
  lumbarTwistDeg: 0,
};

const DEFAULT_OPTIONS = {
  verticalAxis: 'y',
  lateralAxis: 'x',
  twistAxis: 'y',
  tiltAxis: 'z',
  curveDirection: 1,
  maxCurvatureDeg: 60,
  maxTwistDeg: 45,
  maxLateralRatio: 0.12,
  maxTiltDeg: 16,
  twistScale: 0.8,
  damping: 0.12,
} satisfies Required<SpineDeformerOptions>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeDegree(value: number, maxDegree: number) {
  return clamp(Math.abs(value) / maxDegree, 0, 1);
}

function gaussianWeight(t: number, center: number, width: number) {
  const normalized = (t - center) / width;
  return Math.exp(-0.5 * normalized * normalized);
}

function getAxisVector(axis: AxisName) {
  if (axis === 'x') return new THREE.Vector3(1, 0, 0);
  if (axis === 'y') return new THREE.Vector3(0, 1, 0);
  return new THREE.Vector3(0, 0, 1);
}

function getAxisValue(vector: THREE.Vector3, axis: AxisName) {
  return vector[axis];
}

function isTargetNode(object: THREE.Object3D) {
  const name = object.name;

  if (/hip bone/i.test(name)) return false;
  if (/\((C|T|L)\d+\)/i.test(name)) return true;
  if (/\b(C|T|L)\d+\b/i.test(name)) return true;
  if (/sacrum|coccyx/i.test(name)) return true;

  return false;
}

function getSortRank(name: string) {
  const match = name.match(/\((C|T|L)(\d+)\)/i) ?? name.match(/\b(C|T|L)(\d+)\b/i);

  if (match) {
    const section = match[1].toUpperCase();
    const index = Number(match[2]);

    if (section === 'C') return index;
    if (section === 'T') return 7 + index;
    return 19 + index;
  }

  if (/sacrum/i.test(name)) return 25;
  if (/coccyx/i.test(name)) return 26;

  return 999;
}

export class SpineDeformer {
  private readonly root: THREE.Object3D;
  private readonly options: Required<SpineDeformerOptions>;
  private readonly vertebrae: VertebraRecord[] = [];
  private readonly lateralAxisVector: THREE.Vector3;
  private readonly twistAxisVector: THREE.Vector3;
  private readonly tiltAxisVector: THREE.Vector3;
  private readonly qTilt = new THREE.Quaternion();
  private readonly qTwist = new THREE.Quaternion();
  private readonly qCombined = new THREE.Quaternion();
  private readonly tmpPosition = new THREE.Vector3();
  private readonly tmpBox = new THREE.Box3();
  private readonly tmpCenter = new THREE.Vector3();
  private spineHeight = 1;
  private metrics = { ...DEFAULT_METRICS };

  constructor(root: THREE.Object3D, options: SpineDeformerOptions = {}) {
    this.root = root;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.lateralAxisVector = getAxisVector(this.options.lateralAxis);
    this.twistAxisVector = getAxisVector(this.options.twistAxis);
    this.tiltAxisVector = getAxisVector(this.options.tiltAxis);

    this.collectVertebrae();
    this.computeTargets();
  }

  setMetrics(metrics: Partial<SpineDeformerMetrics>) {
    this.metrics = {
      ...this.metrics,
      ...metrics,
    };
    this.computeTargets();
  }

  update(deltaSeconds: number) {
    const alpha = 1 - Math.pow(1 - this.options.damping, Math.max(deltaSeconds, 1 / 120) * 60);

    for (const vertebra of this.vertebrae) {
      vertebra.pivot.position.lerp(vertebra.targetPosition, alpha);
      vertebra.pivot.quaternion.slerp(vertebra.targetQuaternion, alpha);
    }
  }

  reset() {
    this.metrics = { ...DEFAULT_METRICS };

    for (const vertebra of this.vertebrae) {
      vertebra.targetPosition.copy(vertebra.basePosition);
      vertebra.targetQuaternion.copy(vertebra.baseQuaternion);
      vertebra.pivot.position.copy(vertebra.basePosition);
      vertebra.pivot.quaternion.copy(vertebra.baseQuaternion);
    }
  }

  getDebugInfo() {
    return {
      count: this.vertebrae.length,
      names: this.vertebrae.map((vertebra) => vertebra.name),
    };
  }

  private collectVertebrae() {
    const candidates: THREE.Object3D[] = [];
    this.root.updateMatrixWorld(true);

    this.root.traverse((object) => {
      if (isTargetNode(object)) {
        candidates.push(object);
      }
    });

    const sortedCandidates = candidates.sort((left, right) => {
      const leftRank = getSortRank(left.name);
      const rightRank = getSortRank(right.name);

      if (leftRank !== rightRank) return leftRank - rightRank;
      return right.name.localeCompare(left.name);
    });

    const centers = sortedCandidates.map((candidate) => ({
      object: candidate,
      center: this.getParentLocalCenter(candidate),
    }));
    const verticalValues = centers.map(({ center }) => getAxisValue(center, this.options.verticalAxis));
    const minVertical = Math.min(...verticalValues);
    const maxVertical = Math.max(...verticalValues);
    this.spineHeight = Math.max(0.001, maxVertical - minVertical);

    centers.forEach(({ object, center }, index) => {
      const pivot = this.wrapWithPivot(object, center);
      const t = sortedCandidates.length <= 1 ? 0 : index / (sortedCandidates.length - 1);

      this.vertebrae.push({
        name: object.name,
        pivot,
        t,
        basePosition: pivot.position.clone(),
        baseQuaternion: pivot.quaternion.clone(),
        targetPosition: pivot.position.clone(),
        targetQuaternion: pivot.quaternion.clone(),
      });
    });

    if (this.vertebrae.length !== 26) {
      console.warn(
        `[SpineDeformer] 예상 척추 node 수는 26개지만 ${this.vertebrae.length}개를 찾았습니다.`,
      );
    }
  }

  private getParentLocalCenter(object: THREE.Object3D) {
    const parent = object.parent ?? this.root;

    this.tmpBox.setFromObject(object);
    this.tmpBox.getCenter(this.tmpCenter);
    parent.worldToLocal(this.tmpCenter);

    return this.tmpCenter.clone();
  }

  private wrapWithPivot(object: THREE.Object3D, center: THREE.Vector3) {
    const parent = object.parent ?? this.root;
    const originalPosition = object.position.clone();
    const originalQuaternion = object.quaternion.clone();
    const originalScale = object.scale.clone();
    const pivot = new THREE.Group();

    pivot.name = `${object.name} deform pivot`;
    pivot.position.copy(center);
    parent.add(pivot);
    pivot.add(object);

    object.position.copy(originalPosition).sub(center);
    object.quaternion.copy(originalQuaternion);
    object.scale.copy(originalScale);

    return pivot;
  }

  private computeTargets() {
    for (const vertebra of this.vertebrae) {
      const localCurve = this.getLocalCurvature(vertebra.t);
      const localTwist = this.getLocalTwist(vertebra.t);
      const envelope = Math.sin(Math.PI * vertebra.t);
      const sCurve = Math.sin(2 * Math.PI * vertebra.t);
      const lateralOffset =
        sCurve *
        envelope *
        this.spineHeight *
        this.options.maxLateralRatio *
        localCurve *
        this.options.curveDirection;
      const tiltAngle =
        Math.cos(2 * Math.PI * vertebra.t) *
        envelope *
        THREE.MathUtils.degToRad(this.options.maxTiltDeg) *
        localCurve *
        this.options.curveDirection;
      const twistAngle =
        -THREE.MathUtils.degToRad(clamp(localTwist, -this.options.maxTwistDeg, this.options.maxTwistDeg)) *
        this.options.twistScale *
        envelope;

      this.tmpPosition
        .copy(vertebra.basePosition)
        .addScaledVector(this.lateralAxisVector, lateralOffset);

      this.qTilt.setFromAxisAngle(this.tiltAxisVector, tiltAngle);
      this.qTwist.setFromAxisAngle(this.twistAxisVector, twistAngle);
      this.qCombined
        .copy(vertebra.baseQuaternion)
        .multiply(this.qTilt)
        .multiply(this.qTwist);

      vertebra.targetPosition.copy(this.tmpPosition);
      vertebra.targetQuaternion.copy(this.qCombined);
    }
  }

  private getLocalCurvature(t: number) {
    const upperWeight = gaussianWeight(t, 0.28, 0.18);
    const mainWeight = gaussianWeight(t, 0.52, 0.22);
    const lumbarWeight = gaussianWeight(t, 0.78, 0.18);
    const totalWeight = upperWeight + mainWeight + lumbarWeight;

    if (totalWeight <= 0) return 0;

    return (
      normalizeDegree(this.metrics.upperCurvatureDeg, this.options.maxCurvatureDeg) * upperWeight +
      normalizeDegree(this.metrics.mainCurvatureDeg, this.options.maxCurvatureDeg) * mainWeight +
      normalizeDegree(this.metrics.lumbarCurvatureDeg, this.options.maxCurvatureDeg) * lumbarWeight
    ) / totalWeight;
  }

  private getLocalTwist(t: number) {
    const upperWeight = gaussianWeight(t, 0.28, 0.18);
    const mainWeight = gaussianWeight(t, 0.52, 0.22);
    const lumbarWeight = gaussianWeight(t, 0.78, 0.18);
    const totalWeight = upperWeight + mainWeight + lumbarWeight;

    if (totalWeight <= 0) return 0;

    return (
      this.metrics.upperTwistDeg * upperWeight +
      this.metrics.mainTwistDeg * mainWeight +
      this.metrics.lumbarTwistDeg * lumbarWeight
    ) / totalWeight;
  }
}
