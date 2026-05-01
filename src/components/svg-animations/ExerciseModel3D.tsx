import { useRef, useEffect } from "react";
import * as THREE from "three";

// ── 动作动画参数 ──────────────────────────────────────────
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
  "neck-side": {
    headRotate: [[0, 0, 0], [0, 0, 0.4], [0, 0, -0.35], [0, 0, 0.4], [0, 0, 0]],
  },
  "neck-turn": {
    headRotate: [[0, 0, 0], [0, 0.9, 0], [0, -0.9, 0], [0, 0.9, 0], [0, 0, 0]],
  },
  "neck-stretch": {
    headTranslate: [[0, 0, 0], [0.12, 0.05, 0], [-0.08, -0.05, 0], [0.12, 0.05, 0], [0, 0, 0]],
    headRotate: [[0, 0, 0], [0, 0, 0.25], [0, 0, -0.2], [0, 0, 0.25], [0, 0, 0]],
  },
  "shrug": {
    shoulderY: [0, 0.22, 0.22, 0, 0],
  },
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
  "chin-tuck": {
    headTranslate: [[0, 0, 0], [0, -0.08, 0.18], [0, 0, 0]],
  },
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

// ── 辅助函数 ──────────────────────────────────────────────
function createBone(
  from: [number, number, number],
  to: [number, number, number],
  radius: number,
  mat: THREE.Material,
): THREE.Mesh {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  mesh.setRotationFromQuaternion(quat);
  return mesh;
}

function createJoint(pos: [number, number, number], r: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.SphereGeometry(r, 10, 8);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  return mesh;
}

// ── 构建骨架 ──────────────────────────────────────────────
//
//   root（世界原点 = 髋部 y≈0）
//   ├── 腿（固定）
//   ├── chestGroup（原点在 root，parts.torso — 躯干旋转从髋部开始）
//   │   ├── torsoBone: (0,0,0)→(0,0.72,0)  髋→胸
//   │   ├── headGroup: 挂在胸顶，parts.head
//   │   └── shoulderArmGroup: 挂在胸顶-0.06，parts.shoulders（耸肩时升降此组）
//   │       ├── shoulderBar
//   │       ├── leftShoulderGroup → upperArm → elbowGroup → forearm → hand
//   │       └── rightShoulderGroup → …
//
function buildSkeleton(): { root: THREE.Group; parts: Record<string, THREE.Object3D> } {
  const root = new THREE.Group();
  const parts: Record<string, THREE.Object3D> = {};

  const boneMat = new THREE.MeshPhongMaterial({ color: 0xd4c5b9, flatShading: true });
  const jointMat = new THREE.MeshPhongMaterial({ color: 0xc4b5a5, flatShading: true });
  const headMat = new THREE.MeshPhongMaterial({ color: 0xe8dcd0, flatShading: true });

  const BR = 0.045;
  const JR = 0.065;

  // ── 腿（在 root 里，不动） ──
  root.add(createJoint([-0.13, 0, 0], JR, jointMat));
  root.add(createBone([-0.13, 0, 0], [-0.13, -0.52, 0.03], BR, boneMat));
  root.add(createJoint([-0.13, -0.52, 0.03], JR * 0.9, jointMat));
  root.add(createBone([-0.13, -0.52, 0.03], [-0.13, -0.98, 0.05], BR * 0.85, boneMat));

  root.add(createJoint([0.13, 0, 0], JR, jointMat));
  root.add(createBone([0.13, 0, 0], [0.13, -0.52, 0.03], BR, boneMat));
  root.add(createJoint([0.13, -0.52, 0.03], JR * 0.9, jointMat));
  root.add(createBone([0.13, -0.52, 0.03], [0.13, -0.98, 0.05], BR * 0.85, boneMat));

  // ── chestGroup（原点在髋部，躯干旋转以髋为轴） ──
  const chestGroup = new THREE.Group();
  chestGroup.position.set(0, 0, 0);
  root.add(chestGroup);
  parts.torso = chestGroup; // torsoRotate 旋转整个 chestGroup

  // 躯干骨：髋(0,0,0)→胸(0,0.72,0)
  chestGroup.add(createBone([0, 0, 0], [0, 0.72, 0], BR * 1.05, boneMat));
  chestGroup.add(createJoint([0, 0, 0], JR, jointMat));       // 髋
  chestGroup.add(createJoint([0, 0.72, 0], JR * 1.15, jointMat)); // 胸

  // ── 头部组（挂在胸顶，不受耸肩影响） ──
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.72, 0);
  chestGroup.add(headGroup);
  parts.head = headGroup;

  headGroup.add(createBone([0, 0, 0], [0, 0.16, 0], BR * 0.7, boneMat));
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), headMat);
  headMesh.position.set(0, 0.16 + 0.1, 0);
  headGroup.add(headMesh);

  // ── 肩膀+手臂组（可升降，耸肩时只动这个，不动头和躯干骨） ──
  const shoulderArmGroup = new THREE.Group();
  shoulderArmGroup.position.set(0, 0.66, 0);
  chestGroup.add(shoulderArmGroup);
  parts.shoulders = shoulderArmGroup;

  // 肩膀横杆
  shoulderArmGroup.add(createBone([-0.42, 0, 0], [0.42, 0, 0], BR * 0.8, boneMat));

  // 左臂
  const leftUpperGroup = new THREE.Group();
  leftUpperGroup.position.set(-0.42, 0, 0);
  shoulderArmGroup.add(leftUpperGroup);
  parts.leftUpperArm = leftUpperGroup;

  leftUpperGroup.add(createJoint([0, 0, 0], JR, jointMat));
  leftUpperGroup.add(createBone([0, 0, 0], [0, -0.42, 0.03], BR, boneMat));

  const leftElbowGroup = new THREE.Group();
  leftElbowGroup.position.set(0, -0.42, 0.03);
  leftUpperGroup.add(leftElbowGroup);
  parts.leftForearm = leftElbowGroup;

  leftElbowGroup.add(createJoint([0, 0, 0], JR * 0.85, jointMat));
  leftElbowGroup.add(createBone([0, 0, 0], [0, -0.38, 0.02], BR * 0.85, boneMat));
  leftElbowGroup.add(createJoint([0, -0.38, 0.02], JR * 0.8, jointMat));

  // 右臂
  const rightUpperGroup = new THREE.Group();
  rightUpperGroup.position.set(0.42, 0, 0);
  shoulderArmGroup.add(rightUpperGroup);
  parts.rightUpperArm = rightUpperGroup;

  rightUpperGroup.add(createJoint([0, 0, 0], JR, jointMat));
  rightUpperGroup.add(createBone([0, 0, 0], [0, -0.42, 0.03], BR, boneMat));

  const rightElbowGroup = new THREE.Group();
  rightElbowGroup.position.set(0, -0.42, 0.03);
  rightUpperGroup.add(rightElbowGroup);
  parts.rightForearm = rightElbowGroup;

  rightElbowGroup.add(createJoint([0, 0, 0], JR * 0.85, jointMat));
  rightElbowGroup.add(createBone([0, 0, 0], [0, -0.38, 0.02], BR * 0.85, boneMat));
  rightElbowGroup.add(createJoint([0, -0.38, 0.02], JR * 0.8, jointMat));

  return { root, parts };
}

// ── React 组件 ────────────────────────────────────────────
interface Props {
  type: string;
  playing: boolean;
  title?: string;
}

export function ExerciseModel3D({ type, playing, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frontCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sideCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const partsRef = useRef<Record<string, THREE.Object3D>>({});
  const animIdRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());

  const SHOULDER_BASE_Y = 0.66;

  // 初始化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || 280;
    const h = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#111827");
    sceneRef.current = scene;

    // 正视相机
    const fCam = new THREE.PerspectiveCamera(35, w / h, 0.1, 10);
    fCam.position.set(0, 0.75, 4.8);
    fCam.lookAt(0, 0.35, 0);
    frontCamRef.current = fCam;

    // 侧视相机
    const sCam = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
    sCam.position.set(4.8, 0.75, 0);
    sCam.lookAt(0, 0.35, 0);
    sideCamRef.current = sCam;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 灯光
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

    // 地面网格
    const grid = new THREE.PolarGridHelper(1.5, 24, 16, 64, 0x333355, 0x333355);
    grid.position.y = -0.98;
    scene.add(grid);

    const { root, parts } = buildSkeleton();
    scene.add(root);
    partsRef.current = parts;

    const handleResize = () => {
      const cw = container.clientWidth || 280;
      const ch = container.clientHeight || 360;
      renderer.setSize(cw, ch);
      fCam.aspect = cw / ch;
      fCam.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 动画循环（含双视角渲染）
  useEffect(() => {
    const cfg = ANIMS[type];
    if (!cfg) return;

    const parts = partsRef.current;
    const scene = sceneRef.current;
    const fCam = frontCamRef.current;
    const sCam = sideCamRef.current;
    const renderer = rendererRef.current;
    if (!scene || !fCam || !sCam || !renderer) return;

    const duration = 3.0;
    let elapsed = 0;

    const loop = () => {
      const dt = clockRef.current.getDelta();
      if (playing) elapsed += dt;

      const t = (elapsed % duration) / duration;

      const lerpArr = (arr: number[][], t: number): number[] => {
        if (arr.length <= 1) return arr[0] ?? [0, 0, 0];
        const idx = t * (arr.length - 1);
        const lo = Math.floor(idx);
        const hi = Math.min(lo + 1, arr.length - 1);
        const frac = idx - lo;
        return arr[lo].map((v, i) => v + (arr[hi][i] - v) * frac);
      };

      const setRot = (obj: THREE.Object3D | undefined, arr: number[][] | undefined) => {
        if (!obj || !arr) return;
        const [rx, ry, rz] = lerpArr(arr, t);
        obj.rotation.set(rx, ry, rz);
      };

      const setPos = (obj: THREE.Object3D | undefined, arr: number[][] | undefined) => {
        if (!obj || !arr) return;
        const [px, py, pz] = lerpArr(arr, t);
        obj.position.set(px, py, pz);
      };

      setRot(parts.head, cfg.headRotate);
      if (cfg.headTranslate) setPos(parts.head, cfg.headTranslate);

      // 耸肩：只升降 shoulderArmGroup
      if (cfg.shoulderY) {
        const sy = lerpArr(
          cfg.shoulderY.map((v) => [0, v, 0]),
          t,
        );
        if (parts.shoulders) parts.shoulders.position.y = SHOULDER_BASE_Y + sy[1];
      }

      setRot(parts.leftUpperArm, cfg.leftUpperArm);
      setRot(parts.rightUpperArm, cfg.rightUpperArm);
      setRot(parts.leftForearm, cfg.leftForearm);
      setRot(parts.rightForearm, cfg.rightForearm);

      if (cfg.torsoRotate) {
        const [rx, ry, rz] = lerpArr(cfg.torsoRotate, t);
        if (parts.torso) parts.torso.rotation.set(rx, ry, rz);
      }

      // ── 双视角渲染 ──
      const el = renderer.domElement;
      const W = el.width;
      const H = el.height;

      // 1. 正面（全屏）
      renderer.setViewport(0, 0, W, H);
      renderer.setScissor(0, 0, W, H);
      renderer.setScissorTest(false);
      renderer.render(scene, fCam);

      // 2. 侧面（右下角小窗，约 28% 面积）
      const sw = Math.round(W * 0.28);
      const sh = Math.round(H * 0.38);
      const sx = W - sw - 8;
      const sy = H - sh - 8;

      renderer.setViewport(sx, sy, sw, sh);
      renderer.setScissor(sx, sy, sw, sh);
      renderer.setScissorTest(true);

      // 侧面小窗暗底
      const oldBg = scene.background;
      scene.background = new THREE.Color("#0f172a");
      renderer.render(scene, sCam);
      scene.background = oldBg;

      renderer.setScissorTest(false);

      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [type, playing]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div ref={containerRef} className="w-full flex-1 min-h-[320px] relative" />
      {/* 侧视图标签 */}
      <span className="absolute bottom-2 right-2 text-[10px] text-gray-500 bg-dark-900/70 px-1.5 py-0.5 rounded pointer-events-none select-none">
        侧面
      </span>
      <p className="text-gray-400 text-sm mt-1">{title ?? "标准姿势演示"}</p>
    </div>
  );
}
