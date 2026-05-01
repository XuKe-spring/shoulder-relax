import type { Course } from "../types";

const withTotal = (course: Omit<Course, "totalSeconds">): Course => ({
  ...course,
  totalSeconds: course.steps.reduce((sum, step) => sum + step.durationSeconds, 0),
});

const standardSteps = [
  { name: "颈部左右侧屈", durationSeconds: 40, ttsText: "站直身体，头部向左右两侧交替拉伸。", svgAnimation: "neckSideStretch" as const },
  { name: "头部左右转动", durationSeconds: 30, ttsText: "下巴保持水平，头部慢慢左右转动。", svgAnimation: "neckTurn" as const },
  { name: "耸肩放松", durationSeconds: 30, ttsText: "吸气时双肩向耳朵方向提起，呼气时自然落下，手臂保持放松。", svgAnimation: "shoulderShrug" as const },
  { name: "肩部环绕", durationSeconds: 30, ttsText: "双肩先向上，再向后、向下画圆，手臂自然垂放，注意不要憋气。", svgAnimation: "shoulderRoll" as const },
  { name: "扩胸后拉", durationSeconds: 30, ttsText: "手臂向后打开，肩胛骨轻轻靠近。", svgAnimation: "chestOpen" as const },
  { name: "收下巴", durationSeconds: 20, ttsText: "轻轻收下巴，让后颈变长。", svgAnimation: "chinTuck" as const },
  { name: "手臂上举拉伸", durationSeconds: 30, ttsText: "双手向上延伸，肋骨保持稳定。", svgAnimation: "armRaise" as const },
  { name: "站姿侧身拉伸", durationSeconds: 30, ttsText: "身体向两侧延展，保持骨盆稳定。", svgAnimation: "sideStretch" as const },
];

export const courses: Course[] = [
  withTotal({
    id: "micro",
    name: "微休息",
    description: "工作间隙快速放松，适合两分钟站起活动。",
    steps: [
      { name: "颈部左右侧屈", durationSeconds: 30, ttsText: "保持肩膀放松，头部缓慢向左右两侧拉伸。", svgAnimation: "neckSideStretch" },
      { name: "耸肩放松", durationSeconds: 30, ttsText: "吸气耸肩，呼气放松，手臂自然垂放，感受肩颈松开。", svgAnimation: "shoulderShrug" },
      { name: "肩部环绕", durationSeconds: 30, ttsText: "双肩向上、向后、向下慢慢画圆，保持呼吸。", svgAnimation: "shoulderRoll" },
      { name: "开胸扩胸", durationSeconds: 30, ttsText: "双臂向后打开，胸口展开，不要塌腰。", svgAnimation: "chestOpen" },
    ],
  }),
  withTotal({
    id: "standard",
    name: "标准课程",
    description: "完整肩颈舒缓流程，覆盖颈部、肩部、胸椎。",
    steps: standardSteps,
  }),
  withTotal({
    id: "deep",
    name: "深度放松",
    description: "十分钟深度舒展，适合久坐后的完整恢复。",
    steps: [
      ...standardSteps,
      { name: "颈部旋转拉伸", durationSeconds: 40, ttsText: "小范围颈部旋转，不要压迫颈椎。", svgAnimation: "neckCircle" },
      { name: "肩胛骨挤压", durationSeconds: 30, ttsText: "肩胛骨向中间靠近，再慢慢放松。", svgAnimation: "scapulaSqueeze" },
      { name: "胸椎旋转", durationSeconds: 40, ttsText: "胸口左右旋转，骨盆保持稳定。", svgAnimation: "thoracicRotate" },
      { name: "全身舒展收尾", durationSeconds: 40, ttsText: "双手到头顶后向上推，肩膀下沉远离耳朵，深吸气让身体拉长，呼气慢慢放松。", svgAnimation: "fullBodyReach" },
    ],
  }),
];

export const getCourseById = (id: string | undefined) => courses.find((course) => course.id === id);
