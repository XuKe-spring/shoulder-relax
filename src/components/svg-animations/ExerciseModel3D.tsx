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
    headTranslate: [[0, 0, 0], [0, -0.08, 0.15], [0, 0, 0]],
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

// ── 辅助：创建骨头（圆柱体，从 p1 到 p2） ──────────────────
function createBone(
  from: [number, number, number],
  to: [number, number, number],
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const geo = new THREE.CylinderGeometry(radius, radius, length, 8);
  const mesh = new THREE.Mesh(geo, material);

  // 把圆柱体中心放在 from→to 的中点
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const mz = (from[2] + to[2]) / 2;
  mesh.position.set(mx, my, mz);

  // 旋转使圆柱体朝向目标方向
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  mesh.setRotationFromQuaternion(quat);

  return mesh;
}

function createJoint(pos: [number, number, number], radius: number, material: THREE.Material): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 10, 8);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(...pos);
  return mesh;
}

// ── 构建骨架模型 ──────────────────────────────────────────
// 骨架层级（自底向上，父→子自然传递变换）：
//   root
//   ├── 腿（固定在 root，不参与上半身动画）
//   ├── chestGroup（躯干旋转/平移的根）
//   │   ├── 躯干骨 + 肩膀横杆
//   │   ├── headGroup → 脖子骨 + 头部
//   │   ├── leftShoulderGroup → 左上臂骨 + 左肘Group → 左前臂骨 + 左手
//   │   └── rightShoulderGroup → 右上臂骨 + 右肘Group → 右前臂骨 + 右手
//
function buildSkeleton(): { root: THREE.Group; parts: Record<string, THREE.Object3D> } {
  const root = new THREE.Group();
  const parts: Record<string, THREE.Object3D> = {};

  const boneMat = new THREE.MeshPhongMaterial({ color: 0xd4c5b9, flatShading: true });
  const jointMat = new THREE.MeshPhongMaterial({ color: 0xc4b5a5, flatShading: true });
  const headMat = new THREE.MeshPhongMaterial({ color: 0xe8dcd0, flatShading: true });

  const BONE_R = 0.045;   // 骨头半径
  const JOINT_R = 0.065;  // 关节球半径
  const HEAD_R = 0.16;    // 头部半径

  // ── 腿（固定在 root，不受躯干动画影响） ──
  const HIP_Y = 0; // root 原点即髋部高度

  // 左腿
  const lHipJoint = createJoint([-0.13, HIP_Y, 0], JOINT_R, jointMat);
  root.add(lHipJoint);

  const lThigh = createBone([-0.13, HIP_Y, 0], [-0.13, -0.52, 0.03], BONE_R, boneMat);
  root.add(lThigh);

  const lKneeJoint = createJoint([-0.13, -0.52, 0.03], JOINT_R * 0.9, jointMat);
  root.add(lKneeJoint);

  const lShin = createBone([-0.13, -0.52, 0.03], [-0.13, -0.98, 0.05], BONE_R * 0.85, boneMat);
  root.add(lShin);

  // 右腿
  const rHipJoint = createJoint([0.13, HIP_Y, 0], JOINT_R, jointMat);
  root.add(rHipJoint);

  const rThigh = createBone([0.13, HIP_Y, 0], [0.13, -0.52, 0.03], BONE_R, boneMat);
  root.add(rThigh);

  const rKneeJoint = createJoint([0.13, -0.52, 0.03], JOINT_R * 0.9, jointMat);
  root.add(rKneeJoint);

  const rShin = createBone([0.13, -0.52, 0.03], [0.13, -0.98, 0.05], BONE_R * 0.85, boneMat);
  root.add(rShin);

  // ── 躯干组（chestGroup 在 root 的 y=0.65 处，即髋部上方） ──
  const chestGroup = new THREE.Group();
  chestGroup.position.set(0, 0.65, 0);
  root.add(chestGroup);
  parts.torso = chestGroup;

  // 躯干骨（髋→胸）
  const torsoBone = createBone([0, 0, 0], [0, 0.65, 0], BONE_R * 1.05, boneMat);
  chestGroup.add(torsoBone);

  // 髋关节球（躯干底部）
  const hipCenter = createJoint([0, 0, 0], JOINT_R, jointMat);
  chestGroup.add(hipCenter);

  // 胸关节球
  const chestJoint = createJoint([0, 0.65, 0], JOINT_R * 1.1, jointMat);
  chestGroup.add(chestJoint);

  // 肩膀横杆
  const shoulderBar = createBone([-0.42, 0.6, 0], [0.42, 0.6, 0], BONE_R * 0.8, boneMat);
  chestGroup.add(shoulderBar);
  parts.shoulders = chestGroup; // 耸肩通过 chestGroup.position.y 偏移实现

  // ── 头部组（挂在 chestGroup 顶部） ──
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.65, 0);
  chestGroup.add(headGroup);
  parts.head = headGroup;

  // 脖子骨
  const neckBone = createBone([0, 0, 0], [0, 0.18, 0], BONE_R * 0.7, boneMat);
  headGroup.add(neckBone);

  // 头
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 14, 10), headMat);
  headMesh.position.set(0, 0.18 + HEAD_R * 0.6, 0);
  headGroup.add(headMesh);

  // ── 左臂 ──
  const leftShoulderGroup = new THREE.Group();
  leftShoulderGroup.position.set(-0.42, 0.6, 0);
  chestGroup.add(leftShoulderGroup);
  parts.leftUpperArm = leftShoulderGroup;

  const lShoulderJoint = createJoint([0, 0, 0], JOINT_R, jointMat);
  leftShoulderGroup.add(lShoulderJoint);

  const lUpperBone = createBone([0, 0, 0], [0, -0.42, 0.03], BONE_R, boneMat);
  leftShoulderGroup.add(lUpperBone);

  // 左肘组
  const leftElbowGroup = new THREE.Group();
  leftElbowGroup.position.set(0, -0.42, 0.03);
  leftShoulderGroup.add(leftElbowGroup);
  parts.leftForearm = leftElbowGroup;

  const lElbowJoint = createJoint([0, 0, 0], JOINT_R * 0.85, jointMat);
  leftElbowGroup.add(lElbowJoint);

  const lForeBone = createBone([0, 0, 0], [0, -0.38, 0.02], BONE_R * 0.85, boneMat);
  leftElbowGroup.add(lForeBone);

  const lHand = createJoint([0, -0.38, 0.02], JOINT_R * 0.8, jointMat);
  leftElbowGroup.add(lHand);

  // ── 右臂 ──
  const rightShoulderGroup = new THREE.Group();
  rightShoulderGroup.position.set(0.42, 0.6, 0);
  chestGroup.add(rightShoulderGroup);
  parts.rightUpperArm = rightShoulderGroup;

  const rShoulderJoint = createJoint([0, 0, 0], JOINT_R, jointMat);
  rightShoulderGroup.add(rShoulderJoint);

  const rUpperBone = createBone([0, 0, 0], [0, -0.42, 0.03], BONE_R, boneMat);
  rightShoulderGroup.add(rUpperBone);

  // 右肘组
  const rightElbowGroup = new THREE.Group();
  rightElbowGroup.position.set(0, -0.42, 0.03);
  rightShoulderGroup.add(rightElbowGroup);
  parts.rightForearm = rightElbowGroup;

  const rElbowJoint = createJoint([0, 0, 0], JOINT_R * 0.85, jointMat);
  rightElbowGroup.add(rElbowJoint);

  const rForeBone = createBone([0, 0, 0], [0, -0.38, 0.02], BONE_R * 0.85, boneMat);
  rightElbowGroup.add(rForeBone);

  const rHand = createJoint([0, -0.38, 0.02], JOINT_R * 0.8, jointMat);
  rightElbowGroup.add(rHand);

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
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const partsRef = useRef<Record<string, THREE.Object3D>>({});
  const animIdRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());
  const chestBaseY = useRef(0.65); // chestGroup 在 root 中的基础 Y

  // 初始化 Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || 280;
    const h = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#111827");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 10);
    camera.position.set(0, 1.1, 4.0);
    camera.lookAt(0, 0.65, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 3, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8899cc, 0.5);
    fill.position.set(-2, 1, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xaaccff, 0.35);
    rim.position.set(0, 0.5, -2);
    scene.add(rim);

    // 地面参考网格
    const gridHelper = new THREE.PolarGridHelper(1.5, 24, 16, 64, 0x333355, 0x333355);
    gridHelper.position.y = -0.98;
    scene.add(gridHelper);

    const { root, parts } = buildSkeleton();
    scene.add(root);
    partsRef.current = parts;
    chestBaseY.current = 0.65;

    const handleResize = () => {
      const cw = container.clientWidth || 280;
      const ch = container.clientHeight || 360;
      renderer.setSize(cw, ch);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
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

  // 动画循环
  useEffect(() => {
    const cfg = ANIMS[type];
    if (!cfg) return;

    const parts = partsRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

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

      // 耸肩：抬高 chestGroup（躯干+肩+头+手臂全部跟着升高）
      if (cfg.shoulderY) {
        const sy = lerpArr(cfg.shoulderY.map((v) => [0, v, 0]), t);
        if (parts.shoulders) parts.shoulders.position.y = chestBaseY.current + sy[1];
        // 肩部上移时手臂也跟着上移（因为它们都在 chestGroup 内，自动跟随）
      }

      setRot(parts.leftUpperArm, cfg.leftUpperArm);
      setRot(parts.rightUpperArm, cfg.rightUpperArm);
      setRot(parts.leftForearm, cfg.leftForearm);
      setRot(parts.rightForearm, cfg.rightForearm);

      if (cfg.torsoRotate) {
        const [rx, ry, rz] = lerpArr(cfg.torsoRotate, t);
        if (parts.torso) parts.torso.rotation.set(rx, ry, rz);
      }

      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [type, playing]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div ref={containerRef} className="w-full flex-1 min-h-[320px]" />
      <p className="text-gray-400 text-sm mt-3">{title ?? "标准姿势演示"}</p>
    </div>
  );
}
