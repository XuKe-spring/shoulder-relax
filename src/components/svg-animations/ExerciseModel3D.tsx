import { useRef, useEffect } from "react";
import * as THREE from "three";

// ── 动画配置 ──────────────────────────────────────────────
interface AnimConfig {
  headRotate?: [number, number, number][];
  headTranslate?: [number, number, number][];
  shoulderY?: number[];
  leftUpperArm?: [number, number, number][];
  rightUpperArm?: [number, number, number][];
  leftForearm?: [number, number, number][];
  rightForearm?: [number, number, number][];
  torsoRotate?: [number, number, number][];
}

const ANIMS: Record<string, AnimConfig> = {
  "neck-side": { headRotate: [[0, 0, 0], [0, 0, 0.4], [0, 0, -0.35], [0, 0, 0.4], [0, 0, 0]] },
  "neck-turn": { headRotate: [[0, 0, 0], [0, 0.9, 0], [0, -0.9, 0], [0, 0.9, 0], [0, 0, 0]] },
  "neck-stretch": {
    headTranslate: [[0, 0, 0], [0.12, 0.05, 0], [-0.08, -0.05, 0], [0.12, 0.05, 0], [0, 0, 0]],
    headRotate: [[0, 0, 0], [0, 0, 0.25], [0, 0, -0.2], [0, 0, 0.25], [0, 0, 0]],
  },
  "shrug": { shoulderY: [0, 0.22, 0.22, 0, 0] },
  "shoulder-roll": {
    leftUpperArm: [[0, 0, 0], [0, 0, -0.5], [0, -0.4, -0.9], [0, -0.7, -0.5], [0, -0.4, 0.3], [0, 0, 0.5], [0, 0.4, 0.3], [0, 0, -0.5], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [0, 0, 0.5], [0, 0.4, 0.9], [0, 0.7, 0.5], [0, 0.4, -0.3], [0, 0, -0.5], [0, -0.4, -0.3], [0, 0, 0.5], [0, 0, 0]],
  },
  "chest-open": {
    leftUpperArm: [[0, 0, 0], [-0.5, 0, -1.0], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [0.5, 0, 1.0], [0, 0, 0]],
  },
  "scapula-squeeze": {
    leftUpperArm: [[0, 0, 0], [-0.3, 0, -0.8], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [0.3, 0, 0.8], [0, 0, 0]],
  },
  "chin-tuck": { headTranslate: [[0, 0, 0], [0, -0.08, 0.18], [0, 0, 0]] },
  "arm-raise": {
    leftUpperArm: [[0, 0, 0], [-2.2, 0, 0], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [2.2, 0, 0], [0, 0, 0]],
  },
  "torso-twist": {
    torsoRotate: [[0, 0, 0], [0, 0.6, 0], [0, -0.5, 0], [0, 0.6, 0], [0, 0, 0]],
    headRotate: [[0, 0, 0], [0, 0.6, 0], [0, -0.5, 0], [0, 0.6, 0], [0, 0, 0]],
  },
  "full-stretch": {
    leftUpperArm: [[0, 0, 0], [-2.5, 0, -0.3], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [2.5, 0, 0.3], [0, 0, 0]],
    headTranslate: [[0, 0, 0], [0, 0.08, 0.05], [0, 0, 0]],
  },
};

// ── 每个动作的文字提示（显示在画布上） ──────────────────────
const HINTS: Record<string, { text: string; top: string; left: string }[]> = {
  "neck-side": [
    { text: "头向右倒 →", top: "15%", left: "55%" },
    { text: "← 头向左倒", top: "15%", left: "8%" },
  ],
  "neck-turn": [
    { text: "向右转 →", top: "12%", left: "55%" },
    { text: "← 向左转", top: "12%", left: "8%" },
  ],
  "neck-stretch": [
    { text: "↗ 斜上方拉伸", top: "10%", left: "48%" },
  ],
  "shrug": [
    { text: "↑ 耸肩 ↑", top: "18%", left: "38%" },
    { text: "保持→放松", top: "22%", left: "36%" },
  ],
  "shoulder-roll": [
    { text: "⟳ 向前画圈", top: "20%", left: "8%" },
    { text: "⟲ 向后画圈", top: "20%", left: "60%" },
    { text: "💡 看侧面小窗", top: "28%", left: "32%" },
  ],
  "chest-open": [
    { text: "← 手臂后展", top: "25%", left: "8%" },
    { text: "手臂后展 →", top: "25%", left: "58%" },
    { text: "💡 看侧面", top: "32%", left: "36%" },
  ],
  "scapula-squeeze": [
    { text: "← 肩胛夹紧 →", top: "22%", left: "30%" },
    { text: "💡 看侧面", top: "28%", left: "36%" },
  ],
  "chin-tuck": [
    { text: "← 头向后收", top: "12%", left: "8%" },
    { text: "收下巴", top: "16%", left: "42%" },
    { text: "💡 看侧面", top: "22%", left: "36%" },
  ],
  "arm-raise": [
    { text: "↑ 向上伸展 ↑", top: "8%", left: "34%" },
  ],
  "torso-twist": [
    { text: "→ 上身右转", top: "32%", left: "52%" },
    { text: "← 上身左转", top: "32%", left: "10%" },
    { text: "💡 看侧面", top: "40%", left: "36%" },
  ],
  "full-stretch": [
    { text: "↑ 全身舒展 ↑", top: "6%", left: "34%" },
    { text: "深呼吸", top: "14%", left: "40%" },
  ],
};

// ── 3D 方向箭头构建 ────────────────────────────────────────
type ArrowSpec = {
  worldFrom: [number, number, number];
  worldTo: [number, number, number];
  color: number;
};

const ARROW_DEFS: Record<string, ArrowSpec[]> = {
  "neck-side": [
    { worldFrom: [0.22, 0.95, 0], worldTo: [0.55, 0.95, 0], color: 0xfacc15 },
    { worldFrom: [-0.22, 0.95, 0], worldTo: [-0.55, 0.95, 0], color: 0xfacc15 },
  ],
  "neck-turn": [
    { worldFrom: [0.3, 0.95, 0.15], worldTo: [0.55, 0.90, 0.4], color: 0xfacc15 },
    { worldFrom: [-0.3, 0.95, -0.15], worldTo: [-0.55, 0.90, -0.4], color: 0xfacc15 },
  ],
  "neck-stretch": [
    { worldFrom: [0.05, 0.82, 0], worldTo: [0.35, 1.0, 0], color: 0xfacc15 },
  ],
  "shrug": [
    { worldFrom: [-0.5, 0.64, 0], worldTo: [-0.5, 0.88, 0], color: 0xfacc15 },
    { worldFrom: [0.5, 0.64, 0], worldTo: [0.5, 0.88, 0], color: 0xfacc15 },
  ],
  "shoulder-roll": [
    { worldFrom: [-0.55, 0.58, 0.15], worldTo: [-0.55, 0.58, -0.15], color: 0x60a5fa },
    { worldFrom: [0.55, 0.58, -0.15], worldTo: [0.55, 0.58, 0.15], color: 0x60a5fa },
  ],
  "chest-open": [
    { worldFrom: [-0.55, 0.58, 0.1], worldTo: [-0.55, 0.58, -0.4], color: 0xfacc15 },
    { worldFrom: [0.55, 0.58, 0.1], worldTo: [0.55, 0.58, -0.4], color: 0xfacc15 },
  ],
  "scapula-squeeze": [
    { worldFrom: [-0.3, 0.55, 0.1], worldTo: [-0.3, 0.55, -0.3], color: 0xfacc15 },
    { worldFrom: [0.3, 0.55, 0.1], worldTo: [0.3, 0.55, -0.3], color: 0xfacc15 },
  ],
  "chin-tuck": [
    { worldFrom: [0, 0.88, 0.2], worldTo: [0, 0.85, -0.1], color: 0xfacc15 },
  ],
  "arm-raise": [
    { worldFrom: [-0.55, 0.24, 0], worldTo: [-0.55, 0.85, 0], color: 0xfacc15 },
    { worldFrom: [0.55, 0.24, 0], worldTo: [0.55, 0.85, 0], color: 0xfacc15 },
  ],
  "torso-twist": [
    { worldFrom: [0.55, 0.50, 0.12], worldTo: [0.55, 0.50, -0.12], color: 0xfacc15 },
    { worldFrom: [-0.55, 0.50, -0.12], worldTo: [-0.55, 0.50, 0.12], color: 0xfacc15 },
  ],
  "full-stretch": [
    { worldFrom: [-0.55, 0.24, 0], worldTo: [-0.55, 1.05, 0], color: 0xfacc15 },
    { worldFrom: [0.55, 0.24, 0], worldTo: [0.55, 1.05, 0], color: 0xfacc15 },
  ],
};

function makeArrow(from: THREE.Vector3, to: THREE.Vector3, color: number): THREE.Group {
  const g = new THREE.Group();
  const dir = new THREE.Vector3().copy(to).sub(from);
  const len = dir.length();
  dir.normalize();

  // 杆
  const shaftLen = len * 0.7;
  const shaftR = 0.022;
  const shaftGeo = new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 6);
  const shaftMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = shaftLen / 2;
  g.add(shaft);

  // 箭头（锥体）
  const headLen = len * 0.3;
  const headR = 0.05;
  const headGeo = new THREE.ConeGeometry(headR, headLen, 6);
  const headMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = shaftLen + headLen / 2;
  g.add(head);

  // 定位：把 g 放到 from，让 Y 轴指向 to
  g.position.copy(from);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  g.setRotationFromQuaternion(quat);

  return g;
}

// ── 骨架 ──────────────────────────────────────────────────
function bone(from: [number, number, number], to: [number, number, number], r: number, mat: THREE.Material) {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
  m.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
  m.setRotationFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize()),
  );
  return m;
}

function joint(pos: [number, number, number], r: number, mat: THREE.Material) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
  m.position.set(...pos);
  return m;
}

function buildSkeleton() {
  const root = new THREE.Group();
  const parts: Record<string, THREE.Object3D> = {};

  const bMat = new THREE.MeshPhongMaterial({ color: 0xd4c5b9, flatShading: true });
  const jMat = new THREE.MeshPhongMaterial({ color: 0xc4b5a5, flatShading: true });
  const hMat = new THREE.MeshPhongMaterial({ color: 0xe8dcd0, flatShading: true });
  const BR = 0.045, JR = 0.065;

  for (const side of [-1, 1]) {
    const x = side * 0.13;
    root.add(joint([x, 0, 0], JR, jMat));
    root.add(bone([x, 0, 0], [x, -0.52, 0.03], BR, bMat));
    root.add(joint([x, -0.52, 0.03], JR * 0.9, jMat));
    root.add(bone([x, -0.52, 0.03], [x, -0.98, 0.05], BR * 0.85, bMat));
  }

  const chest = new THREE.Group();
  root.add(chest);
  parts.torso = chest;

  chest.add(bone([0, 0, 0], [0, 0.72, 0], BR * 1.05, bMat));
  chest.add(joint([0, 0, 0], JR, jMat));
  chest.add(joint([0, 0.72, 0], JR * 1.15, jMat));

  const headG = new THREE.Group();
  headG.position.set(0, 0.72, 0);
  chest.add(headG);
  parts.head = headG;

  headG.add(bone([0, 0, 0], [0, 0.16, 0], BR * 0.7, bMat));
  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), hMat);
  headSphere.position.set(0, 0.26, 0);
  headG.add(headSphere);

  const shArm = new THREE.Group();
  shArm.position.set(0, 0.66, 0);
  chest.add(shArm);
  parts.shoulders = shArm;

  shArm.add(bone([-0.42, 0, 0], [0.42, 0, 0], BR * 0.8, bMat));

  for (const side of [-1, 1]) {
    const sx = side * 0.42;
    const upG = new THREE.Group();
    upG.position.set(sx, 0, 0);
    shArm.add(upG);
    parts[side === -1 ? "leftUpperArm" : "rightUpperArm"] = upG;

    upG.add(joint([0, 0, 0], JR, jMat));
    upG.add(bone([0, 0, 0], [0, -0.42, 0.03], BR, bMat));

    const elG = new THREE.Group();
    elG.position.set(0, -0.42, 0.03);
    upG.add(elG);
    parts[side === -1 ? "leftForearm" : "rightForearm"] = elG;

    elG.add(joint([0, 0, 0], JR * 0.85, jMat));
    elG.add(bone([0, 0, 0], [0, -0.38, 0.02], BR * 0.85, bMat));
    elG.add(joint([0, -0.38, 0.02], JR * 0.8, jMat));
  }

  return { root, parts };
}

// ── 组件 ──────────────────────────────────────────────────
interface Props {
  type: string;
  playing: boolean;
  title?: string;
}

const CANVAS_W = 360;
const CANVAS_H = 520;
const SHOULDER_BASE = 0.66;

export function ExerciseModel3D({ type, playing, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const fCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const partsRef = useRef<Record<string, THREE.Object3D>>({});
  const arrowsRef = useRef<THREE.Group[]>([]);
  const animRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());

  // 初始化场景
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#111827");
    sceneRef.current = scene;

    const fCam = new THREE.PerspectiveCamera(35, CANVAS_W / CANVAS_H, 0.1, 10);
    fCam.position.set(0, 0.65, 4.8);
    fCam.lookAt(0, 0.2, 0);
    fCamRef.current = fCam;

    const sCam = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
    sCam.position.set(4.8, 0.65, 0);
    sCam.lookAt(0, 0.2, 0);
    sCamRef.current = sCam;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(CANVAS_W, CANVAS_H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 3, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8899cc, 0.5);
    fill.position.set(-2, 1, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xaaccff, 0.35);
    rim.position.set(0, 0.5, -2);
    scene.add(rim);

    const grid = new THREE.PolarGridHelper(1.8, 24, 16, 64, 0x333355, 0x333355);
    grid.position.y = -0.98;
    scene.add(grid);

    const { root, parts } = buildSkeleton();
    scene.add(root);
    partsRef.current = parts;

    return () => {
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // 重建方向箭头（type 变化时）
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 清除旧箭头
    arrowsRef.current.forEach((a) => scene.remove(a));
    arrowsRef.current = [];

    const specs = ARROW_DEFS[type];
    if (!specs) return;

    for (const s of specs) {
      const arrow = makeArrow(
        new THREE.Vector3(...s.worldFrom),
        new THREE.Vector3(...s.worldTo),
        s.color,
      );
      scene.add(arrow);
      arrowsRef.current.push(arrow);
    }

    return () => {
      arrowsRef.current.forEach((a) => scene.remove(a));
      arrowsRef.current = [];
    };
  }, [type]);

  // 动画
  useEffect(() => {
    const cfg = ANIMS[type];
    if (!cfg) return;
    const parts = partsRef.current;
    const scene = sceneRef.current;
    const fCam = fCamRef.current;
    const sCam = sCamRef.current;
    const renderer = rendererRef.current;
    if (!scene || !fCam || !sCam || !renderer) return;

    const dur = 3.0;
    let elapsed = 0;

    const loop = () => {
      const dt = clockRef.current.getDelta();
      if (playing) elapsed += dt;
      const t = (elapsed % dur) / dur;

      const lerp = (arr: number[][], t: number): number[] => {
        if (arr.length <= 1) return arr[0] ?? [0, 0, 0];
        const idx = t * (arr.length - 1);
        const lo = Math.floor(idx);
        const hi = Math.min(lo + 1, arr.length - 1);
        const f = idx - lo;
        return arr[lo].map((v, i) => v + (arr[hi][i] - v) * f);
      };
      const sRot = (o: THREE.Object3D | undefined, a: number[][] | undefined) => {
        if (!o || !a) return;
        const [x, y, z] = lerp(a, t);
        o.rotation.set(x, y, z);
      };
      const sPos = (o: THREE.Object3D | undefined, a: number[][] | undefined) => {
        if (!o || !a) return;
        const [x, y, z] = lerp(a, t);
        o.position.set(x, y, z);
      };

      sRot(parts.head, cfg.headRotate);
      if (cfg.headTranslate) sPos(parts.head, cfg.headTranslate);

      if (cfg.shoulderY) {
        const sy = lerp(cfg.shoulderY.map((v) => [0, v, 0]), t);
        if (parts.shoulders) parts.shoulders.position.y = SHOULDER_BASE + sy[1];
      }

      sRot(parts.leftUpperArm, cfg.leftUpperArm);
      sRot(parts.rightUpperArm, cfg.rightUpperArm);
      sRot(parts.leftForearm, cfg.leftForearm);
      sRot(parts.rightForearm, cfg.rightForearm);

      if (cfg.torsoRotate) {
        const [x, y, z] = lerp(cfg.torsoRotate, t);
        if (parts.torso) parts.torso.rotation.set(x, y, z);
      }

      // 箭头脉动
      const pulse = 0.55 + 0.35 * Math.sin(elapsed * 3.5);
      for (const a of arrowsRef.current) {
        a.children.forEach((child) => {
          if ((child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
            mat.opacity = pulse;
          }
        });
      }

      // 渲染正面
      renderer.setViewport(0, 0, CANVAS_W, CANVAS_H);
      renderer.setScissor(0, 0, CANVAS_W, CANVAS_H);
      renderer.setScissorTest(false);
      renderer.render(scene, fCam);

      // 渲染侧面小窗
      const sw = Math.round(CANVAS_W * 0.28);
      const sh = Math.round(CANVAS_H * 0.32);
      const sx = CANVAS_W - sw - 6;
      const sy = CANVAS_H - sh - 6;

      renderer.setViewport(sx, sy, sw, sh);
      renderer.setScissor(sx, sy, sw, sh);
      renderer.setScissorTest(true);
      const oldBg = scene.background;
      scene.background = new THREE.Color("#0f172a");
      renderer.render(scene, sCam);
      scene.background = oldBg;
      renderer.setScissorTest(false);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [type, playing]);

  // 当前动作的文字提示
  const hintItems = HINTS[type] ?? [];

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border border-dark-700 select-none"
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        {/* 文字提示叠加层 */}
        {playing &&
          hintItems.map((h, i) => (
            <span
              key={i}
              className="absolute pointer-events-none text-xs font-bold drop-shadow-lg"
              style={{
                top: h.top,
                left: h.left,
                color: h.text.startsWith("💡") ? "#93c5fd" : "#fde68a",
                textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                animation: "hintPulse 1.5s ease-in-out infinite",
              }}
            >
              {h.text}
            </span>
          ))}
        {/* 侧面小窗标签 */}
        <span
          className="absolute pointer-events-none text-[10px] text-gray-400 bg-dark-900/80 px-1.5 py-0.5 rounded"
          style={{ bottom: 6, right: 6 }}
        >
          侧面
        </span>
      </div>
      <p className="text-gray-400 text-sm mt-1">{title ?? "标准姿势演示"}</p>
    </div>
  );
}
