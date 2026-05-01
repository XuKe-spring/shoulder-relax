import type { CalibrationData, PoseFeedback, PoseDeviationCounts } from "../types";

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

const isVisible = (lm: Landmark | undefined): boolean =>
  !!lm && (lm.visibility ?? 1) > 0.5;

const keypointsVisible = (landmarks: Landmark[], indices: number[]): boolean =>
  indices.every((i) => isVisible(landmarks[i]));

// 平滑缓冲区：减少单帧噪声
export class SmoothingBuffer {
  private buffer: Landmark[][] = [];
  private maxSize: number;

  constructor(maxSize = 6) {
    this.maxSize = maxSize;
  }

  push(landmarks: Landmark[]): Landmark[] | null {
    this.buffer.push(landmarks);
    if (this.buffer.length > this.maxSize) this.buffer.shift();
    if (this.buffer.length < 3) return null;

    // 对每个关键点做加权平均（可见度越高权重越大）
    const result: Landmark[] = [];
    const n = this.buffer[0].length;
    for (let i = 0; i < n; i++) {
      let totalW = 0;
      let sx = 0, sy = 0, sz = 0;
      for (const frame of this.buffer) {
        const lm = frame[i];
        if (!lm) continue;
        const w = lm.visibility ?? 1;
        sx += lm.x * w;
        sy += lm.y * w;
        sz += lm.z * w;
        totalW += w;
      }
      if (totalW > 0) {
        result.push({ x: sx / totalW, y: sy / totalW, z: sz / totalW, visibility: 1 });
      } else {
        result.push(this.buffer[this.buffer.length - 1][i] ?? { x: 0, y: 0, z: 0, visibility: 0 });
      }
    }
    return result;
  }

  reset() {
    this.buffer = [];
  }

  get size() {
    return this.buffer.length;
  }
}

// 计算校准基准 + 标准差（用于自适应阈值）
export function computeCalibration(
  frames: Landmark[][]
): (CalibrationData & { tolerance: { shoulderY: number; noseShoulder: number; shoulderHip: number } }) | null {
  const valid = frames.filter((lm) => keypointsVisible(lm, [0, 11, 12]));

  if (valid.length < 5) return null;

  const shoulderYs: number[] = [];
  const noseShoulderOffsets: number[] = [];
  const shoulderHipOffsets: number[] = [];

  for (const lm of valid) {
    const nose = lm[0];
    const lShoulder = lm[11];
    const rShoulder = lm[12];
    const shoulderCX = (lShoulder.x + rShoulder.x) / 2;
    const shoulderCY = (lShoulder.y + rShoulder.y) / 2;

    shoulderYs.push(shoulderCY);
    noseShoulderOffsets.push(nose.x - shoulderCX);

    if (keypointsVisible(lm, [23, 24])) {
      const lHip = lm[23];
      const rHip = lm[24];
      const hipCX = (lHip.x + rHip.x) / 2;
      shoulderHipOffsets.push(shoulderCX - hipCX);
    }
  }

  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const std = (arr: number[], avg: number) =>
    Math.sqrt(arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length);

  const avgShoulderY = mean(shoulderYs);
  const avgNoseShoulder = mean(noseShoulderOffsets);
  const avgShoulderHip = shoulderHipOffsets.length > 0 ? mean(shoulderHipOffsets) : null;

  const stdShoulderY = std(shoulderYs, avgShoulderY);
  const stdNoseShoulder = std(noseShoulderOffsets, avgNoseShoulder);
  const stdShoulderHip = shoulderHipOffsets.length > 0
    ? std(shoulderHipOffsets, avgShoulderHip!)
    : 0.05;

  // 阈值 = max(2倍标准差, 最小阈值) 避免标准差太小时误报
  return {
    shoulderY: avgShoulderY,
    noseShoulderOffset: avgNoseShoulder,
    shoulderHipOffset: avgShoulderHip,
    tolerance: {
      shoulderY: Math.max(stdShoulderY * 2.5, 0.03),
      noseShoulder: Math.max(stdNoseShoulder * 2.5, 0.04),
      shoulderHip: Math.max(stdShoulderHip * 2.5, 0.05),
    },
  };
}

function canAnalyze(landmarks: Landmark[]): boolean {
  return keypointsVisible(landmarks, [0, 11, 12]);
}

// 存储姿态采样（供 DeepSeek 分析用）
export interface PoseSample {
  timestampMs: number;
  deviations: PoseDeviationCounts;
  shoulderY: number;
  noseShoulderOffset: number;
  shoulderHipOffset: number | null;
}

let _poseSamples: PoseSample[] = [];

export function pushPoseSample(s: PoseSample) {
  _poseSamples.push(s);
}

export function getPoseSamples(): PoseSample[] {
  return _poseSamples;
}

export function clearPoseSamples() {
  _poseSamples = [];
}

export function analyzePose(
  landmarks: Landmark[] | null,
  baseline: (CalibrationData & { tolerance?: { shoulderY: number; noseShoulder: number; shoulderHip: number } }) | null
): PoseFeedback {
  const empty = { shoulderShrug: 0, slouch: 0, forwardHead: 0 };

  if (!landmarks || !canAnalyze(landmarks)) {
    return {
      level: "idle",
      label: "等待识别",
      detail: "请后退一些，确保头部和双肩在画面中",
      deviations: empty,
    };
  }

  if (!baseline) {
    return {
      level: "idle",
      label: "校准中",
      detail: "正在采集你的自然站姿基准…站稳别动",
      deviations: empty,
    };
  }

  const tol = baseline.tolerance ?? { shoulderY: 0.03, noseShoulder: 0.04, shoulderHip: 0.05 };

  const nose = landmarks[0];
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const shoulderCX = (lShoulder.x + rShoulder.x) / 2;
  const shoulderCY = (lShoulder.y + rShoulder.y) / 2;
  const noseShoulderOffset = nose.x - shoulderCX;

  // 耸肩：肩Y偏上（图像坐标Y向下，值变小=肩上提）
  const shoulderShrug = shoulderCY < baseline.shoulderY - tol.shoulderY ? 1 : 0;

  // 驼背：肩相对于髋的位置偏移
  let slouch = 0;
  let shoulderHipOffset: number | null = null;
  if (baseline.shoulderHipOffset !== null && keypointsVisible(landmarks, [23, 24])) {
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const hipCX = (lHip.x + rHip.x) / 2;
    shoulderHipOffset = shoulderCX - hipCX;
    if (Math.abs(shoulderHipOffset - baseline.shoulderHipOffset) > tol.shoulderHip) {
      slouch = 1;
    }
  }

  // 头前倾：鼻-肩偏移
  const forwardHead =
    Math.abs(noseShoulderOffset - baseline.noseShoulderOffset) > tol.noseShoulder ? 1 : 0;

  const deviations = { shoulderShrug, slouch, forwardHead };
  const activeCount = shoulderShrug + slouch + forwardHead;

  // 存储采样
  pushPoseSample({
    timestampMs: Date.now(),
    deviations,
    shoulderY: shoulderCY,
    noseShoulderOffset,
    shoulderHipOffset,
  });

  if (activeCount === 0) {
    return {
      level: "good",
      label: "姿势良好",
      detail: "肩颈稳定，继续保持 👍",
      deviations,
    };
  }

  const parts: string[] = [];
  if (forwardHead) parts.push("头部前倾，收下巴向后移");
  if (shoulderShrug) parts.push("肩膀耸起，沉肩放松沉下去");
  if (slouch) parts.push("背部弯曲，挺直腰打开胸口");

  return {
    level: activeCount >= 2 ? "bad" : "warn",
    label: activeCount >= 2 ? "⚠ 需要调整" : "略有偏差",
    detail: parts.join("；"),
    deviations,
  };
}
