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
    rightUpperArm: [[0, 0, 0], [0.5, 0, -1.0], [0, 0, 0]],
  },
  "scapula-squeeze": {
    leftUpperArm: [[0, 0, 0], [-0.3, 0, -0.8], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [0.3, 0, -0.8], [0, 0, 0]],
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

// ── 文字指引（每个动作的要点） ──────────────────────────────
type Guidance = {
  frontHints: string[];   // 正视图上的文字标注
  sideHints: string[];    // 侧视图上的文字标注
  actionPoints: string[]; // 动作要点
};

const GUIDANCE: Record<string, Guidance> = {
  "neck-side": {
    frontHints: ["头向右倒 →", "← 头向左倒"],
    sideHints: ["耳朵靠近肩膀", "肩保持不动"],
    actionPoints: ["慢慢将头倒向一侧，感受颈部拉伸", "肩膀保持下沉，不要跟着耸起", "每侧保持 3-5 秒再换边"],
  },
  "neck-turn": {
    frontHints: ["下巴水平转动", "不仰头不低头"],
    sideHints: ["头绕垂直轴旋转", "身体保持正对前方"],
    actionPoints: ["下巴保持水平，像说「不」一样转头", "眼睛看向肩膀方向", "肩膀和胸口保持不动"],
  },
  "neck-stretch": {
    frontHints: ["↗ 斜上方拉伸"],
    sideHints: ["头向斜前方移动", "后颈有拉伸感"],
    actionPoints: ["头向斜前方轻轻拉伸", "感受后颈的延展", "动作轻柔，不勉强"],
  },
  "shrug": {
    frontHints: ["↑ 耸肩 ↑", "保持 → 放松"],
    sideHints: ["肩膀向耳朵提起", "手臂放松垂下"],
    actionPoints: ["吸气时肩膀向耳朵方向提起", "保持 2-3 秒", "呼气时突然完全放松，感受肩颈释放"],
  },
  "shoulder-roll": {
    frontHints: ["1 上提", "2 后绕", "3 下沉"],
    sideHints: ["肩膀画最大的圆", "向前→向上→向后→向下"],
    actionPoints: ["肩膀先向上提，不要耸住", "再向后绕，像把肩胛骨带到身后", "最后向下沉肩，手臂始终放松"],
  },
  "chest-open": {
    frontHints: ["手臂向后打开", "胸口向前展开"],
    sideHints: ["手臂往身体后方", "不塌腰"],
    actionPoints: ["双手在背后交叉，手臂向后伸展", "胸口向前打开，肩胛骨轻轻靠近", "不要塌腰，肋骨保持稳定"],
  },
  "scapula-squeeze": {
    frontHints: ["肩胛骨向中间靠拢", "← 夹紧 →"],
    sideHints: ["肩膀轻轻向后收", "胸口自然打开"],
    actionPoints: ["想象肩胛骨向脊柱靠近", "不要耸肩，手臂自然下垂", "夹住 1-2 秒，慢慢放松"],
  },
  "chin-tuck": {
    frontHints: ["收下巴", "做「双下巴」"],
    sideHints: ["头向后平移", "后颈拉长"],
    actionPoints: ["不是低头，是头向后水平移动", "下巴轻轻往里收", "后颈拉长，想象头顶有根线向上拉"],
  },
  "arm-raise": {
    frontHints: ["↑ 向上伸展 ↑", "十指交叉掌心向上"],
    sideHints: ["手臂贴近耳朵", "不耸肩"],
    actionPoints: ["双臂向上伸直，十指交叉", "掌心向上推，感受身体两侧拉伸", "肩膀下沉不耸肩"],
  },
  "torso-twist": {
    frontHints: ["上身右转 →", "← 上身左转"],
    sideHints: ["骨盆保持不动", "只用胸椎旋转"],
    actionPoints: ["胸口带动上半身旋转", "骨盆和双脚保持朝前", "动作慢一点，不用力甩腰"],
  },
  "full-stretch": {
    frontHints: ["↑ 全身舒展 ↑", "深呼吸"],
    sideHints: ["向上延展", "吸气拉长呼气放松"],
    actionPoints: ["双手在头顶向上推，身体拉长", "肩膀下沉远离耳朵", "深吸气向上延展，缓慢呼气放松"],
  },
};

// ── 3D 箭头 ────────────────────────────────────────────────
type ArrowSpec = { worldFrom: [number, number, number]; worldTo: [number, number, number]; color: number };

const ARROW_DEFS: Record<string, ArrowSpec[]> = {
  "neck-side": [
    { worldFrom: [0.22, 0.95, 0], worldTo: [0.50, 0.95, 0], color: 0xfacc15 },
    { worldFrom: [-0.22, 0.95, 0], worldTo: [-0.50, 0.95, 0], color: 0xfacc15 },
  ],
  "neck-turn": [
    { worldFrom: [0.30, 0.95, 0.15], worldTo: [0.55, 0.88, 0.40], color: 0xfacc15 },
    { worldFrom: [-0.30, 0.95, -0.15], worldTo: [-0.55, 0.88, -0.40], color: 0xfacc15 },
  ],
  "neck-stretch": [
    { worldFrom: [0.05, 0.82, 0], worldTo: [0.30, 1.0, 0], color: 0xfacc15 },
  ],
  "shrug": [
    { worldFrom: [-0.50, 0.64, 0], worldTo: [-0.50, 0.88, 0], color: 0xfacc15 },
    { worldFrom: [0.50, 0.64, 0], worldTo: [0.50, 0.88, 0], color: 0xfacc15 },
  ],
  "shoulder-roll": [
    { worldFrom: [-0.55, 0.58, 0.15], worldTo: [-0.55, 0.58, -0.15], color: 0x60a5fa },
    { worldFrom: [0.55, 0.58, -0.15], worldTo: [0.55, 0.58, 0.15], color: 0x60a5fa },
  ],
  "chest-open": [
    { worldFrom: [-0.55, 0.58, 0.1], worldTo: [-0.55, 0.58, -0.40], color: 0xfacc15 },
    { worldFrom: [0.55, 0.58, 0.1], worldTo: [0.55, 0.58, -0.40], color: 0xfacc15 },
  ],
  "scapula-squeeze": [
    { worldFrom: [-0.30, 0.55, 0.1], worldTo: [-0.30, 0.55, -0.30], color: 0xfacc15 },
    { worldFrom: [0.30, 0.55, 0.1], worldTo: [0.30, 0.55, -0.30], color: 0xfacc15 },
  ],
  "chin-tuck": [
    { worldFrom: [0, 0.88, 0.20], worldTo: [0, 0.85, -0.10], color: 0xfacc15 },
  ],
  "arm-raise": [
    { worldFrom: [-0.55, 0.24, 0], worldTo: [-0.55, 0.90, 0], color: 0xfacc15 },
    { worldFrom: [0.55, 0.24, 0], worldTo: [0.55, 0.90, 0], color: 0xfacc15 },
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

  const shaftLen = len * 0.7;
  const shaftR = 0.022;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 6),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
  );
  shaft.position.y = shaftLen / 2;
  g.add(shaft);

  const headLen = len * 0.3;
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, headLen, 6),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
  head.position.y = shaftLen + headLen / 2;
  g.add(head);

  g.position.copy(from);
  g.setRotationFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir),
  );
  return g;
}

// ── 骨架构建 ──────────────────────────────────────────────
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

const CANVAS_W = 560;
const CANVAS_H = 480;
const DIVIDER_X = 310; // 正面 55%，侧面 45%
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

  const guidance = GUIDANCE[type];

  // 初始化
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b1628");
    sceneRef.current = scene;

    // 正视相机（左半）
    const frontW = DIVIDER_X;
    const fCam = new THREE.PerspectiveCamera(32, frontW / CANVAS_H, 0.1, 10);
    fCam.position.set(0, 0.65, 5.0);
    fCam.lookAt(0, 0.15, 0);
    fCamRef.current = fCam;

    // 侧视相机（右半）
    const sideW = CANVAS_W - DIVIDER_X;
    const sCam = new THREE.PerspectiveCamera(32, sideW / CANVAS_H, 0.1, 10);
    sCam.position.set(5.0, 0.65, 0);
    sCam.lookAt(0, 0.15, 0);
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

    const grid = new THREE.PolarGridHelper(1.9, 24, 16, 64, 0x333355, 0x333355);
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

  // 方向箭头
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    arrowsRef.current.forEach((a) => scene.remove(a));
    arrowsRef.current = [];

    const specs = ARROW_DEFS[type];
    if (!specs) return;
    for (const s of specs) {
      const arrow = makeArrow(new THREE.Vector3(...s.worldFrom), new THREE.Vector3(...s.worldTo), s.color);
      scene.add(arrow);
      arrowsRef.current.push(arrow);
    }
    return () => {
      arrowsRef.current.forEach((a) => scene.remove(a));
      arrowsRef.current = [];
    };
  }, [type]);

  // 动画循环
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
      const pulse = 0.5 + 0.4 * Math.sin(elapsed * 3.5);
      for (const a of arrowsRef.current) {
        a.children.forEach((c) => {
          const m = c as THREE.Mesh;
          if (m.material) (m.material as THREE.MeshBasicMaterial).opacity = pulse;
        });
      }

      // ── 渲染正面（左半） ──
      renderer.setViewport(0, 0, DIVIDER_X, CANVAS_H);
      renderer.setScissor(0, 0, DIVIDER_X, CANVAS_H);
      renderer.setScissorTest(false);
      renderer.render(scene, fCam);

      // ── 渲染侧面（右半） ──
      renderer.setViewport(DIVIDER_X, 0, CANVAS_W - DIVIDER_X, CANVAS_H);
      renderer.setScissor(DIVIDER_X, 0, CANVAS_W - DIVIDER_X, CANVAS_H);
      renderer.setScissorTest(true);
      const oldBg = scene.background;
      scene.background = new THREE.Color("#08111f");
      renderer.render(scene, sCam);
      scene.background = oldBg;
      renderer.setScissorTest(false);

      // ── 分隔线 ──
      // (使用一个简单的 CSS 方式，这里用 canvas 画线)
      // 在渲染后手动在 canvas 上画竖线会覆盖 3D 内容，所以用 scene 里的线，或者干脆不用线。

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [type, playing]);

  return (
    <div className="flex flex-col items-center">
      {/* 双视图画布 */}
      <div className="relative rounded-lg overflow-hidden border border-slate-700/60 bg-[#0b1628]"
        style={{ width: CANVAS_W, height: CANVAS_H }}>
        <div ref={containerRef} className="absolute inset-0" />

        {/* 正视图标签 */}
        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-slate-900/70 text-slate-300 text-xs font-bold pointer-events-none">
          正面
        </span>

        {/* 侧视图标签 */}
        <span className="absolute top-3 z-10 px-2 py-0.5 rounded-full bg-slate-900/70 text-slate-300 text-xs font-bold pointer-events-none"
          style={{ left: DIVIDER_X + 10 }}>
          侧面
        </span>

        {/* 分隔线 */}
        <div className="absolute top-0 bottom-0 w-px bg-slate-600/40 pointer-events-none"
          style={{ left: DIVIDER_X }} />

        {/* 正视图文字提示 */}
        {playing && guidance?.frontHints.map((h, i) => (
          <span key={`f${i}`}
            className="absolute pointer-events-none text-xs font-bold text-amber-200/90 drop-shadow-lg"
            style={{
              top: `${18 + i * 24}%`,
              left: `${8 + (i % 2) * 52}%`,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              animation: "hintPulse 1.8s ease-in-out infinite",
            }}>
            {h}
          </span>
        ))}

        {/* 侧视图文字提示 */}
        {playing && guidance?.sideHints.map((h, i) => (
          <span key={`s${i}`}
            className="absolute pointer-events-none text-xs font-bold text-blue-200/90 drop-shadow-lg"
            style={{
              top: `${55 + i * 22}%`,
              left: DIVIDER_X + 10,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              animation: "hintPulse 1.8s ease-in-out infinite",
              animationDelay: `${i * 0.3}s`,
            }}>
            {h}
          </span>
        ))}
      </div>

      {/* 动作要点 */}
      {guidance && (
        <div className="w-full mt-3 px-3 py-3 rounded-lg border border-amber-500/20 bg-amber-900/10"
          style={{ maxWidth: CANVAS_W }}>
          <span className="text-amber-200/90 text-xs font-bold block mb-2">动作要点</span>
          <ol className="m-0 pl-4 text-slate-300 text-xs leading-relaxed grid gap-1">
            {guidance.actionPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-gray-400 text-sm mt-2">{title ?? "标准姿势演示"}</p>
    </div>
  );
}
