import { useRef, useEffect } from "react";
import * as THREE from "three";

// ── 动作动画参数 ──────────────────────────────────────────
interface AnimConfig {
  headRotate?: [number, number, number][];  // [x, y, z] 欧拉角
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
    headRotate: [[0, 0, 0], [0, 0, 0.35], [0, 0, -0.3], [0, 0, 0.35], [0, 0, 0]],
  },
  "neck-turn": {
    headRotate: [[0, 0, 0], [0, 0.8, 0], [0, -0.8, 0], [0, 0.8, 0], [0, 0, 0]],
  },
  "neck-stretch": {
    headTranslate: [[0, 0, 0], [0.15, 0.05, 0], [-0.1, -0.05, 0], [0.15, 0.05, 0], [0, 0, 0]],
    headRotate: [[0, 0, 0], [0, 0, 0.25], [0, 0, -0.2], [0, 0, 0.25], [0, 0, 0]],
  },
  "shrug": {
    shoulderY: [0, 0.25, 0.25, 0, 0],
  },
  "shoulder-roll": {
    leftUpperArm: [[0, 0, 0], [0, 0, -0.5], [0, -0.3, -0.8], [0, -0.6, -0.5], [0, -0.3, 0.3], [0, 0, 0.5], [0, 0.3, 0.3], [0, 0, -0.5], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [0, 0, 0.5], [0, 0.3, 0.8], [0, 0.6, 0.5], [0, 0.3, -0.3], [0, 0, -0.5], [0, -0.3, -0.3], [0, 0, 0.5], [0, 0, 0]],
  },
  "chest-open": {
    leftUpperArm: [[0, 0, 0], [-0.5, 0, -0.9], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [0.5, 0, 0.9], [0, 0, 0]],
  },
  "scapula-squeeze": {
    leftUpperArm: [[0, 0, 0], [-0.3, 0, -0.7], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [0.3, 0, 0.7], [0, 0, 0]],
  },
  "chin-tuck": {
    headTranslate: [[0, 0, 0], [0, -0.1, 0.2], [0, 0, 0]],
  },
  "arm-raise": {
    leftUpperArm: [[0, 0, 0], [-1.8, 0, 0], [0, 0, 0]],
    leftForearm: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [1.8, 0, 0], [0, 0, 0]],
  },
  "torso-twist": {
    torsoRotate: [[0, 0, 0], [0, 0.5, 0], [0, -0.4, 0], [0, 0.5, 0], [0, 0, 0]],
    headRotate: [[0, 0, 0], [0, 0.5, 0], [0, -0.4, 0], [0, 0.5, 0], [0, 0, 0]],
  },
  "full-stretch": {
    leftUpperArm: [[0, 0, 0], [-2.3, 0, -0.3], [0, 0, 0]],
    rightUpperArm: [[0, 0, 0], [2.3, 0, 0.3], [0, 0, 0]],
    headTranslate: [[0, 0, 0], [0, 0.1, 0.05], [0, 0, 0]],
  },
};

// ── 构建人体模型 ──────────────────────────────────────────
function buildHuman(): { root: THREE.Group; parts: Record<string, THREE.Object3D> } {
  const root = new THREE.Group();
  const parts: Record<string, THREE.Object3D> = {};
  const skin = 0xffd6b0;
  const cloth = 0x4a72ff;

  // 材质
  const skinMat = new THREE.MeshPhongMaterial({ color: skin, flatShading: true });
  const clothMat = new THREE.MeshPhongMaterial({ color: cloth, flatShading: true });
  const darkMat = new THREE.MeshPhongMaterial({ color: 0x333344, flatShading: true });

  // ── 躯干组 ──
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.9, 0);
  root.add(torsoGroup);
  parts.torso = torsoGroup;

  // 躯干（圆柱）
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.75, 12), clothMat);
  torso.position.y = 0;
  torsoGroup.add(torso);

  // 肩膀横杆
  const shoulderBar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), clothMat);
  shoulderBar.rotation.z = Math.PI / 2;
  shoulderBar.position.y = 0.35;
  torsoGroup.add(shoulderBar);
  parts.shoulders = shoulderBar;

  // ── 头部组 ──
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.55, 0);
  root.add(headGroup);
  parts.head = headGroup;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), skinMat);
  head.position.y = 0;
  headGroup.add(head);

  // 脖子
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 8), skinMat);
  neck.position.y = -0.17;
  headGroup.add(neck);

  // ── 左臂 ──
  const lUpperGroup = new THREE.Group();
  lUpperGroup.position.set(-0.48, 1.25, 0);
  root.add(lUpperGroup);
  parts.leftUpperArm = lUpperGroup;

  const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.52, 8), clothMat);
  lUpper.position.y = -0.26;
  lUpperGroup.add(lUpper);

  // 左肘 + 前臂
  const lForeGroup = new THREE.Group();
  lForeGroup.position.y = -0.52;
  lUpperGroup.add(lForeGroup);
  parts.leftForearm = lForeGroup;

  const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.45, 8), skinMat);
  lFore.position.y = -0.22;
  lForeGroup.add(lFore);

  // 左手球
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), skinMat);
  lHand.position.y = -0.45;
  lForeGroup.add(lHand);

  // ── 右臂 ──
  const rUpperGroup = new THREE.Group();
  rUpperGroup.position.set(0.48, 1.25, 0);
  root.add(rUpperGroup);
  parts.rightUpperArm = rUpperGroup;

  const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.52, 8), clothMat);
  rUpper.position.y = -0.26;
  rUpperGroup.add(rUpper);

  const rForeGroup = new THREE.Group();
  rForeGroup.position.y = -0.52;
  rUpperGroup.add(rForeGroup);
  parts.rightForearm = rForeGroup;

  const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.45, 8), skinMat);
  rFore.position.y = -0.22;
  rForeGroup.add(rFore);

  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), skinMat);
  rHand.position.y = -0.45;
  rForeGroup.add(rHand);

  // ── 腿 ──
  const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.6, 8), darkMat);
  lThigh.position.set(-0.14, 0.2, 0);
  root.add(lThigh);

  const lShin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.5, 8), darkMat);
  lShin.position.set(-0.14, -0.3, 0);
  root.add(lShin);

  const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.6, 8), darkMat);
  rThigh.position.set(0.14, 0.2, 0);
  root.add(rThigh);

  const rShin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.5, 8), darkMat);
  rShin.position.set(0.14, -0.3, 0);
  root.add(rShin);

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
    camera.position.set(0, 1.2, 3.5);
    camera.lookAt(0, 0.9, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(2, 3, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8899cc, 0.4);
    fill.position.set(-2, 1, -1);
    scene.add(fill);

    // 地面参考
    const groundGeo = new THREE.PlaneGeometry(3, 3);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x1a2236, transparent: true, opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.65;
    scene.add(ground);

    // 网格线
    const gridHelper = new THREE.PolarGridHelper(1.5, 24, 16, 64, 0x333355, 0x333355);
    gridHelper.position.y = -0.64;
    scene.add(gridHelper);

    const { root, parts } = buildHuman();
    scene.add(root);
    partsRef.current = parts;

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

    const duration = 3.0; // 一个循环周期
    let elapsed = 0;

    const loop = () => {
      const dt = clockRef.current.getDelta();
      if (playing) elapsed += dt;

      const t = (elapsed % duration) / duration; // 0..1

      // 线性插值函数
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

      if (cfg.shoulderY) {
        const sy = lerpArr(cfg.shoulderY.map(v => [0, v, 0]), t);
        if (parts.shoulders) parts.shoulders.position.y = 0.35 + sy[1];
        // 手臂跟着肩膀动
        if (parts.leftUpperArm) parts.leftUpperArm.position.y = 1.25 + sy[1];
        if (parts.rightUpperArm) parts.rightUpperArm.position.y = 1.25 + sy[1];
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
