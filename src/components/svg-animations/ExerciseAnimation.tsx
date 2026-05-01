import { motion } from "framer-motion";

// 每种动作类型的动画参数：头部偏移、手臂旋转角度等
const animationConfig: Record<string, {
  headX?: number[];
  headY?: number[];
  headRotate?: number[];
  shoulderY?: number[];
  leftArmAngle?: number[];
  rightArmAngle?: number[];
  bodyRotate?: number[];
}> = {
  "neck-side": {
    headX: [-4, 12, -4],
    headRotate: [-8, 10, -8],
  },
  "neck-turn": {
    headRotate: [-6, 6, -6],
  },
  "neck-stretch": {
    headX: [-6, 10, -6],
    headRotate: [-6, 8, -6],
  },
  "shrug": {
    shoulderY: [6, -10, 6],
  },
  "shoulder-roll": {
    leftArmAngle: [0, -30, -60, -30, 0, 30, 60, 30, 0],
    rightArmAngle: [0, -30, -60, -30, 0, 30, 60, 30, 0],
  },
  "chest-open": {
    leftArmAngle: [12, -20, 12],
    rightArmAngle: [-12, 20, -12],
  },
  "scapula-squeeze": {
    leftArmAngle: [10, -18, 10],
    rightArmAngle: [-10, 18, -10],
  },
  "chin-tuck": {
    headY: [6, -4, 6],
  },
  "arm-raise": {
    leftArmAngle: [0, -110, 0],
    rightArmAngle: [0, 110, 0],
  },
  "torso-twist": {
    bodyRotate: [0, 10, 0, -10, 0],
    headX: [-4, 8, -4, 4, -4],
  },
  "full-stretch": {
    leftArmAngle: [-20, -80, -20],
    rightArmAngle: [20, 80, 20],
    headY: [0, -4, 0],
  },
};

interface Props {
  type: string;
  playing: boolean;
  title?: string;
}

export function ExerciseAnimation({ type, playing, title }: Props) {
  const cfg = animationConfig[type] ?? {};
  const trans = { duration: 3, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 240" className="w-72 h-72" role="img" aria-label={title ?? "动作演示"}>
        <defs>
          <linearGradient id="bodyGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* 躯干 */}
        <motion.g
          animate={playing && cfg.bodyRotate ? { rotate: cfg.bodyRotate } : {}}
          transition={trans}
        >
          {/* 身体矩形 */}
          <rect x="85" y="80" width="30" height="80" rx="10" fill="none" stroke="url(#bodyGrad)" strokeWidth="3" />

          {/* 肩膀线 */}
          <motion.g
            animate={playing && cfg.shoulderY ? { y: cfg.shoulderY } : {}}
            transition={trans}
          >
            <line x1="55" y1="90" x2="145" y2="90" stroke="url(#bodyGrad)" strokeWidth="3" strokeLinecap="round" />

            {/* 左臂 */}
            <motion.g
              animate={playing && cfg.leftArmAngle ? { rotate: cfg.leftArmAngle } : {}}
              transition={trans}
            >
              <line x1="55" y1="90" x2="35" y2="150" stroke="url(#bodyGrad)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="35" cy="150" r="5" fill="#60a5fa" />
            </motion.g>

            {/* 右臂 */}
            <motion.g
              animate={playing && cfg.rightArmAngle ? { rotate: cfg.rightArmAngle } : {}}
              transition={trans}
            >
              <line x1="145" y1="90" x2="165" y2="150" stroke="url(#bodyGrad)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="165" cy="150" r="5" fill="#60a5fa" />
            </motion.g>

            {/* 肩关节 */}
            <circle cx="55" cy="90" r="5" fill="#34d399" />
            <circle cx="145" cy="90" r="5" fill="#34d399" />
          </motion.g>

          {/* 头部 */}
          <motion.g
            animate={playing ? {
              x: cfg.headX ?? [0, 0, 0],
              y: cfg.headY ?? [0, 0, 0],
              rotate: cfg.headRotate ?? [0, 0, 0],
            } : {}}
            transition={trans}
          >
            <circle cx="100" cy="55" r="24" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            {/* 眼睛示意 */}
            <circle cx="92" cy="52" r="3" fill="#f1f5f9" />
            <circle cx="108" cy="52" r="3" fill="#f1f5f9" />
            {/* 脖子 */}
            <line x1="100" y1="79" x2="100" y2="85" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />
          </motion.g>

          {/* 髋关节 */}
          <circle cx="70" cy="160" r="5" fill="#60a5fa" />
          <circle cx="130" cy="160" r="5" fill="#60a5fa" />

          {/* 腿 */}
          <line x1="70" y1="160" x2="60" y2="220" stroke="url(#bodyGrad)" strokeWidth="3" strokeLinecap="round" />
          <line x1="130" y1="160" x2="140" y2="220" stroke="url(#bodyGrad)" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      </svg>

      {/* 动作名称 */}
      <p className="text-gray-400 text-sm mt-3">{title ?? "标准姿势演示"}</p>
    </div>
  );
}

// 保留旧的导出方式供 svgComponents 索引使用
export default ExerciseAnimation;
