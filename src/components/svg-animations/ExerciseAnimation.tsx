import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { AnimationKey } from '../../types'

interface ExerciseAnimationProps {
  type: AnimationKey
  title: string
}

const transition = { duration: 3, repeat: Infinity, ease: 'easeInOut' as const }
const quickTransition = { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const }

const motionFor = (type: AnimationKey) => {
  switch (type) {
    case 'neckSideStretch':
      return { headX: [-6, 10, -6], headRotate: [-10, 12, -10], armY: [0, 0, 0] }
    case 'armRaise':
    case 'fullBodyReach':
      return { headX: [0, 0, 0], headRotate: [0, 0, 0], armY: [18, -28, 18] }
    case 'sideStretch':
      return { headX: [-10, 12, -10], headRotate: [-6, 8, -6], armY: [4, -20, 4] }
    default:
      return { headX: [0, 0, 0], headRotate: [0, 0, 0], armY: [0, 0, 0] }
  }
}

const ActionPoints = ({ points }: { points: string[] }) => (
  <div className="action-points">
    <strong>动作要点</strong>
    <ol>
      {points.map((point) => <li key={point}>{point}</li>)}
    </ol>
  </div>
)

const FrontBody = ({ children, ariaLabel }: { children?: ReactNode; ariaLabel: string }) => (
  <svg viewBox="0 0 360 360" role="img" aria-label={ariaLabel} className="exercise-svg shoulder-front-svg">
    <defs>
      <linearGradient id="frontBodyLine" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#4dd4ac" />
        <stop offset="100%" stopColor="#6aa7ff" />
      </linearGradient>
    </defs>
    <circle cx="180" cy="78" r="32" fill="#eef8ff" stroke="#6aa7ff" strokeWidth="5" />
    <line x1="180" y1="112" x2="180" y2="238" stroke="url(#frontBodyLine)" strokeWidth="12" strokeLinecap="round" />
    <line x1="180" y1="238" x2="134" y2="305" stroke="url(#frontBodyLine)" strokeWidth="10" strokeLinecap="round" />
    <line x1="180" y1="238" x2="226" y2="305" stroke="url(#frontBodyLine)" strokeWidth="10" strokeLinecap="round" />
    {children}
  </svg>
)

const SideHead = ({ children, label }: { children?: ReactNode; label: string }) => (
  <svg viewBox="0 0 210 250" role="img" aria-label={label}>
    <circle cx="92" cy="54" r="25" fill="#eef8ff" stroke="#6aa7ff" strokeWidth="4" />
    <line x1="92" y1="80" x2="92" y2="168" stroke="#4dd4ac" strokeWidth="9" strokeLinecap="round" />
    <circle cx="96" cy="102" r="12" fill="#4dd4ac" />
    {children}
  </svg>
)

const ShoulderShrugViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="耸肩放松正视图">
        <motion.g animate={{ y: [16, -22, 16] }} transition={quickTransition}>
          <line x1="122" y1="158" x2="238" y2="158" stroke="url(#frontBodyLine)" strokeWidth="12" strokeLinecap="round" />
          <line x1="122" y1="158" x2="104" y2="238" stroke="url(#frontBodyLine)" strokeWidth="9" strokeLinecap="round" />
          <line x1="238" y1="158" x2="256" y2="238" stroke="url(#frontBodyLine)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="122" cy="158" r="12" fill="#4dd4ac" />
          <circle cx="238" cy="158" r="12" fill="#4dd4ac" />
        </motion.g>
        <motion.g animate={{ y: [12, -18, 12] }} transition={quickTransition}>
          <line x1="98" y1="174" x2="98" y2="126" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
          <path d="M84 140 L98 124 L112 140" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="262" y1="174" x2="262" y2="126" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
          <path d="M248 140 L262 124 L276 140" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </FrontBody>
    </div>
    <div className="side-view">
      <span className="view-label">侧视图</span>
      <SideHead label="耸肩放松侧视图">
        <motion.g animate={{ y: [12, -20, 12] }} transition={quickTransition}>
          <circle cx="96" cy="102" r="13" fill="#facc15" />
          <line x1="96" y1="102" x2="116" y2="184" stroke="#6aa7ff" strokeWidth="8" strokeLinecap="round" />
        </motion.g>
        <line x1="150" y1="138" x2="150" y2="82" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
        <path d="M138 94 L150 80 L162 94" fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <text x="105" y="226" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">肩头向上，不抬手</text>
      </SideHead>
    </div>
    <ActionPoints points={['吸气时肩膀向耳朵方向提起', '呼气时肩膀自然落下', '手臂放松垂下，不主动抬手']} />
  </div>
)

const ShoulderRollViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="肩部环绕正视图">
        <motion.g animate={{ y: [0, -18, 0, 16, 0], x: [0, 8, 0, -8, 0] }} transition={transition}>
          <line x1="122" y1="158" x2="238" y2="158" stroke="url(#frontBodyLine)" strokeWidth="12" strokeLinecap="round" />
          <line x1="122" y1="158" x2="104" y2="238" stroke="url(#frontBodyLine)" strokeWidth="9" strokeLinecap="round" />
          <line x1="238" y1="158" x2="256" y2="238" stroke="url(#frontBodyLine)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="122" cy="158" r="12" fill="#4dd4ac" />
          <circle cx="238" cy="158" r="12" fill="#4dd4ac" />
        </motion.g>
        <path d="M88 158 C92 104 152 104 156 158 C156 210 90 210 88 158" fill="none" stroke="#facc15" strokeDasharray="7 7" strokeWidth="6" />
        <path d="M204 158 C208 104 268 104 272 158 C272 210 206 210 204 158" fill="none" stroke="#facc15" strokeDasharray="7 7" strokeWidth="6" />
        <motion.circle cx="122" cy="104" r="10" fill="#facc15" animate={{ cx: [122, 156, 122, 88, 122], cy: [104, 158, 210, 158, 104] }} transition={transition} />
        <motion.circle cx="238" cy="104" r="10" fill="#facc15" animate={{ cx: [238, 272, 238, 204, 238], cy: [104, 158, 210, 158, 104] }} transition={transition} />
        <text x="122" y="96" textAnchor="middle" fill="#fef3c7" fontSize="16" fontWeight="900">1 上提</text>
        <text x="282" y="164" textAnchor="middle" fill="#fef3c7" fontSize="16" fontWeight="900">2 后绕</text>
        <text x="122" y="230" textAnchor="middle" fill="#fef3c7" fontSize="16" fontWeight="900">3 下沉</text>
      </FrontBody>
    </div>
    <div className="side-view side-view-large">
      <span className="view-label">侧视图</span>
      <SideHead label="肩部环绕侧视图">
        <ellipse cx="96" cy="112" rx="30" ry="42" fill="none" stroke="#facc15" strokeDasharray="6 6" strokeWidth="6" />
        <motion.g animate={{ x: [0, 24, 0, -20, 0], y: [-28, 0, 30, 0, -28] }} transition={transition}>
          <circle cx="96" cy="112" r="14" fill="#facc15" />
          <line x1="96" y1="112" x2="118" y2="192" stroke="#6aa7ff" strokeWidth="8" strokeLinecap="round" />
        </motion.g>
        <path d="M136 78 C174 94 174 132 136 156" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
        <path d="M136 156 L138 135 L156 146" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <text x="108" y="226" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">向上、向后、向下</text>
      </SideHead>
    </div>
    <ActionPoints points={['肩膀先向上提，不要耸住', '再向后绕，像把肩胛骨带到身后', '最后向下沉肩，手臂始终放松']} />
  </div>
)

const ChestOpenViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="扩胸后拉正视图">
        <line x1="122" y1="158" x2="238" y2="158" stroke="url(#frontBodyLine)" strokeWidth="12" strokeLinecap="round" />
        <circle cx="122" cy="158" r="11" fill="#4dd4ac" />
        <circle cx="238" cy="158" r="11" fill="#4dd4ac" />
        <motion.g animate={{ opacity: [0.55, 1, 0.55] }} transition={transition}>
          <motion.line x1="122" y1="158" stroke="#6aa7ff" strokeWidth="9" strokeLinecap="round" animate={{ x2: [98, 72, 98], y2: [224, 188, 224] }} transition={transition} />
          <motion.line x1="238" y1="158" stroke="#6aa7ff" strokeWidth="9" strokeLinecap="round" animate={{ x2: [262, 288, 262], y2: [224, 188, 224] }} transition={transition} />
          <motion.circle r="8" fill="#dffcf2" animate={{ cx: [98, 72, 98], cy: [224, 188, 224] }} transition={transition} />
          <motion.circle r="8" fill="#dffcf2" animate={{ cx: [262, 288, 262], cy: [224, 188, 224] }} transition={transition} />
        </motion.g>
        <text x="180" y="334" textAnchor="middle" fill="#fef3c7" fontSize="18" fontWeight="900">手臂向后打开，胸口展开</text>
      </FrontBody>
    </div>
    <div className="side-view side-view-large">
      <span className="view-label">侧视图</span>
      <SideHead label="扩胸后拉侧视图">
        <motion.g animate={{ x: [24, -34, 24], y: [16, -8, 16] }} transition={transition}>
          <line x1="96" y1="102" x2="118" y2="186" stroke="#6aa7ff" strokeWidth="8" strokeLinecap="round" />
          <circle cx="118" cy="186" r="8" fill="#dffcf2" />
        </motion.g>
        <path d="M146 122 C108 104 76 100 44 114" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
        <path d="M48 114 L66 102 L64 122" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <text x="108" y="226" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">手臂往身体后方打开</text>
      </SideHead>
    </div>
    <ActionPoints points={['手臂从身体两侧向后打开', '胸口向前展开，肩胛骨轻轻靠近', '不要塌腰，肋骨保持稳定']} />
  </div>
)

const NeckTurnViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="头部左右转动正视图">
        <motion.g animate={{ x: [-12, 12, -12] }} transition={transition}>
          <ellipse cx="180" cy="78" rx="20" ry="31" fill="#facc15" opacity="0.5" />
          <line x1="180" y1="78" x2="205" y2="78" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
        </motion.g>
        <path d="M132 94 C160 122 200 122 228 94" fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
        <text x="180" y="334" textAnchor="middle" fill="#fef3c7" fontSize="18" fontWeight="900">下巴水平，头向左右看</text>
      </FrontBody>
    </div>
    <div className="side-view">
      <span className="view-label">俯视辅助图</span>
      <svg viewBox="0 0 210 250" role="img" aria-label="头部转动俯视辅助图">
        <ellipse cx="105" cy="100" rx="42" ry="54" fill="#eef8ff" stroke="#6aa7ff" strokeWidth="5" />
        <motion.line x1="105" y1="100" x2="150" y2="100" stroke="#facc15" strokeWidth="8" strokeLinecap="round" animate={{ rotate: [-45, 45, -45] }} transition={transition} style={{ transformOrigin: '105px 100px' }} />
        <path d="M58 100 C74 52 136 52 152 100" fill="none" stroke="#facc15" strokeDasharray="7 7" strokeWidth="6" />
        <text x="105" y="214" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">只转头，不扭肩</text>
      </svg>
    </div>
    <ActionPoints points={['下巴保持水平，不仰头不低头', '眼睛看向左右两侧', '肩膀和胸口保持正对前方']} />
  </div>
)

const ChinTuckViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="收下巴正视图">
        <motion.g animate={{ y: [0, 4, 0] }} transition={quickTransition}>
          <line x1="150" y1="104" x2="210" y2="104" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
          <path d="M168 92 L148 104 L168 116" fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
        <text x="180" y="334" textAnchor="middle" fill="#fef3c7" fontSize="18" fontWeight="900">像做“双下巴”，后颈变长</text>
      </FrontBody>
    </div>
    <div className="side-view side-view-large">
      <span className="view-label">侧视图</span>
      <SideHead label="收下巴侧视图">
        <motion.g animate={{ x: [24, -18, 24] }} transition={quickTransition}>
          <circle cx="118" cy="58" r="6" fill="#facc15" />
          <line x1="118" y1="58" x2="92" y2="58" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
        </motion.g>
        <path d="M158 62 L112 62" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
        <path d="M124 50 L108 62 L124 74" fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <text x="106" y="226" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">头整体向后平移</text>
      </SideHead>
    </div>
    <ActionPoints points={['不是低头，是头向后平移', '下巴轻轻往里收', '后颈拉长，肩膀放松']} />
  </div>
)

const NeckCircleViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="颈部旋转拉伸正视图">
        <ellipse cx="180" cy="78" rx="48" ry="42" fill="none" stroke="#facc15" strokeDasharray="7 7" strokeWidth="5" />
        <motion.circle cx="180" cy="36" r="8" fill="#facc15" animate={{ cx: [180, 228, 180, 132, 180], cy: [36, 78, 120, 78, 36] }} transition={transition} />
        <text x="180" y="334" textAnchor="middle" fill="#fef3c7" fontSize="18" fontWeight="900">小范围画圈，不压颈椎</text>
      </FrontBody>
    </div>
    <div className="side-view">
      <span className="view-label">侧视图</span>
      <SideHead label="颈部旋转拉伸侧视图">
        <ellipse cx="92" cy="54" rx="36" ry="30" fill="none" stroke="#facc15" strokeDasharray="6 6" strokeWidth="5" />
        <motion.circle cx="92" cy="24" r="8" fill="#facc15" animate={{ cx: [92, 128, 92, 56, 92], cy: [24, 54, 84, 54, 24] }} transition={transition} />
        <text x="106" y="226" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">轻柔小圈</text>
      </SideHead>
    </div>
    <ActionPoints points={['动作范围小一点，避免压迫颈椎', '速度放慢，感觉颈侧被轻轻拉开', '如果头晕，立刻停止']} />
  </div>
)

const ScapulaSqueezeViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="肩胛骨挤压正视图">
        <motion.g animate={{ x: [0, -18, 0] }} transition={transition}>
          <path d="M124 146 L148 214 L108 214 Z" fill="rgba(250, 204, 21, 0.5)" stroke="#facc15" strokeWidth="4" />
        </motion.g>
        <motion.g animate={{ x: [0, 18, 0] }} transition={transition}>
          <path d="M236 146 L252 214 L212 214 Z" fill="rgba(250, 204, 21, 0.5)" stroke="#facc15" strokeWidth="4" />
        </motion.g>
        <path d="M136 178 L170 178" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
        <path d="M224 178 L190 178" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
        <text x="180" y="334" textAnchor="middle" fill="#fef3c7" fontSize="18" fontWeight="900">肩胛骨向中间靠近</text>
      </FrontBody>
    </div>
    <div className="side-view side-view-large">
      <span className="view-label">侧视图</span>
      <SideHead label="肩胛骨挤压侧视图">
        <motion.g animate={{ x: [20, -18, 20] }} transition={transition}>
          <circle cx="96" cy="102" r="12" fill="#facc15" />
          <line x1="96" y1="102" x2="118" y2="184" stroke="#6aa7ff" strokeWidth="8" strokeLinecap="round" />
        </motion.g>
        <path d="M150 112 L98 112" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
        <path d="M112 100 L96 112 L112 124" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <text x="106" y="226" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">肩膀轻轻向后收</text>
      </SideHead>
    </div>
    <ActionPoints points={['想象肩胛骨向脊柱靠近', '胸口自然打开，不要耸肩', '夹住 1 秒，再慢慢放松']} />
  </div>
)

const ThoracicRotateViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="胸椎旋转正视图">
        <motion.g animate={{ rotate: [-18, 18, -18] }} transition={transition} style={{ transformOrigin: '180px 172px' }}>
          <line x1="118" y1="158" x2="242" y2="158" stroke="#facc15" strokeWidth="12" strokeLinecap="round" />
          <line x1="180" y1="122" x2="180" y2="222" stroke="#facc15" strokeWidth="10" strokeLinecap="round" opacity="0.55" />
        </motion.g>
        <line x1="132" y1="238" x2="226" y2="238" stroke="#6aa7ff" strokeWidth="10" strokeLinecap="round" />
        <text x="180" y="334" textAnchor="middle" fill="#fef3c7" fontSize="18" fontWeight="900">胸口左右转，骨盆稳定</text>
      </FrontBody>
    </div>
    <div className="side-view">
      <span className="view-label">俯视辅助图</span>
      <svg viewBox="0 0 210 250" role="img" aria-label="胸椎旋转俯视辅助图">
        <ellipse cx="105" cy="122" rx="54" ry="36" fill="rgba(77, 212, 172, 0.22)" stroke="#4dd4ac" strokeWidth="5" />
        <motion.line x1="105" y1="122" x2="162" y2="122" stroke="#facc15" strokeWidth="10" strokeLinecap="round" animate={{ rotate: [-36, 36, -36] }} transition={transition} style={{ transformOrigin: '105px 122px' }} />
        <line x1="74" y1="174" x2="136" y2="174" stroke="#6aa7ff" strokeWidth="9" strokeLinecap="round" />
        <text x="105" y="218" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">上半身转，骨盆不跟着转</text>
      </svg>
    </div>
    <ActionPoints points={['胸口带动上半身左右旋转', '骨盆和双脚保持朝前', '动作慢一点，不甩腰']} />
  </div>
)

const FullBodyReachViews = () => (
  <div className="dual-action-view">
    <div className="front-view">
      <span className="view-label">正视图</span>
      <FrontBody ariaLabel="全身舒展收尾正视图">
        <motion.g animate={{ y: [10, -18, 10] }} transition={transition}>
          <line x1="126" y1="150" x2="104" y2="62" stroke="url(#frontBodyLine)" strokeWidth="10" strokeLinecap="round" />
          <line x1="234" y1="150" x2="256" y2="62" stroke="url(#frontBodyLine)" strokeWidth="10" strokeLinecap="round" />
          <line x1="104" y1="62" x2="256" y2="62" stroke="#facc15" strokeWidth="9" strokeLinecap="round" />
          <circle cx="104" cy="62" r="8" fill="#facc15" />
          <circle cx="256" cy="62" r="8" fill="#facc15" />
        </motion.g>
        <motion.g animate={{ y: [14, -18, 14] }} transition={transition}>
          <line x1="180" y1="76" x2="180" y2="24" stroke="#facc15" strokeWidth="7" strokeLinecap="round" />
          <path d="M166 40 L180 22 L194 40" fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="128" y1="96" x2="128" y2="54" stroke="#facc15" strokeWidth="6" strokeLinecap="round" opacity="0.78" />
          <line x1="232" y1="96" x2="232" y2="54" stroke="#facc15" strokeWidth="6" strokeLinecap="round" opacity="0.78" />
        </motion.g>
        <motion.ellipse
          cx="180"
          cy="174"
          rx="58"
          ry="34"
          fill="none"
          stroke="#6aa7ff"
          strokeWidth="5"
          animate={{ rx: [48, 66, 48], opacity: [0.45, 0.9, 0.45] }}
          transition={transition}
        />
        <text x="180" y="334" textAnchor="middle" fill="#fef3c7" fontSize="18" fontWeight="900">双手在头顶向上推，身体拉长</text>
      </FrontBody>
    </div>
    <div className="side-view side-view-large">
      <span className="view-label">侧视图</span>
      <SideHead label="全身舒展收尾侧视图">
        <motion.g animate={{ y: [10, -16, 10] }} transition={transition}>
          <line x1="96" y1="102" x2="96" y2="28" stroke="#6aa7ff" strokeWidth="8" strokeLinecap="round" />
          <circle cx="96" cy="28" r="8" fill="#facc15" />
        </motion.g>
        <line x1="134" y1="92" x2="134" y2="42" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
        <path d="M122 56 L134 40 L146 56" fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <motion.path
          d="M54 132 C86 104 128 104 160 132"
          fill="none"
          stroke="#6aa7ff"
          strokeWidth="5"
          strokeLinecap="round"
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={transition}
        />
        <text x="106" y="226" textAnchor="middle" fill="#fef3c7" fontSize="15" fontWeight="900">向上延展，不耸肩夹耳</text>
      </SideHead>
    </div>
    <ActionPoints points={['双手到头顶后向上推，不是快速甩手', '肩膀下沉，远离耳朵', '吸气向上延展，呼气慢慢放松收尾']} />
  </div>
)

export const ExerciseAnimation = ({ type, title }: ExerciseAnimationProps) => {
  const movement = motionFor(type)
  const guidedViews: Partial<Record<AnimationKey, ReactNode>> = {
    neckTurn: <NeckTurnViews />,
    shoulderShrug: <ShoulderShrugViews />,
    shoulderRoll: <ShoulderRollViews />,
    chestOpen: <ChestOpenViews />,
    chinTuck: <ChinTuckViews />,
    neckCircle: <NeckCircleViews />,
    scapulaSqueeze: <ScapulaSqueezeViews />,
    thoracicRotate: <ThoracicRotateViews />,
    fullBodyReach: <FullBodyReachViews />,
  }

  if (guidedViews[type]) {
    return (
      <div className="animation-stage">
        <div className="panel-label">标准动作演示</div>
        {guidedViews[type]}
        <div className="animation-caption">{title}</div>
      </div>
    )
  }

  return (
    <div className="animation-stage">
      <div className="panel-label">标准动作演示</div>
      <svg viewBox="0 0 360 360" role="img" aria-label={title} className="exercise-svg">
        <defs>
          <linearGradient id="bodyLine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#4dd4ac" />
            <stop offset="100%" stopColor="#6aa7ff" />
          </linearGradient>
        </defs>
        <motion.g animate={{ x: movement.headX, rotate: movement.headRotate }} transition={transition} style={{ transformOrigin: '180px 98px' }}>
          <circle cx="180" cy="82" r="33" fill="#eef8ff" stroke="#6aa7ff" strokeWidth="5" />
          <line x1="180" y1="115" x2="180" y2="145" stroke="url(#bodyLine)" strokeWidth="10" strokeLinecap="round" />
        </motion.g>
        <line x1="180" y1="145" x2="180" y2="235" stroke="url(#bodyLine)" strokeWidth="12" strokeLinecap="round" />
        <motion.g animate={{ y: movement.armY }} transition={transition}>
          <line x1="124" y1="154" x2="236" y2="154" stroke="url(#bodyLine)" strokeWidth="11" strokeLinecap="round" />
          <line x1="124" y1="154" x2="92" y2="218" stroke="url(#bodyLine)" strokeWidth="9" strokeLinecap="round" />
          <line x1="236" y1="154" x2="268" y2="218" stroke="url(#bodyLine)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="124" cy="154" r="9" fill="#4dd4ac" />
          <circle cx="236" cy="154" r="9" fill="#4dd4ac" />
          <circle cx="92" cy="218" r="8" fill="#6aa7ff" />
          <circle cx="268" cy="218" r="8" fill="#6aa7ff" />
        </motion.g>
        <line x1="180" y1="235" x2="132" y2="302" stroke="url(#bodyLine)" strokeWidth="10" strokeLinecap="round" />
        <line x1="180" y1="235" x2="228" y2="302" stroke="url(#bodyLine)" strokeWidth="10" strokeLinecap="round" />
        <circle cx="180" cy="145" r="10" fill="#dffcf2" />
        <circle cx="180" cy="235" r="10" fill="#dffcf2" />
      </svg>
      <div className="animation-caption">{title}</div>
    </div>
  )
}
