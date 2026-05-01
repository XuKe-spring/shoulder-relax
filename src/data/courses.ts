import type { Course } from "../types";

export const courses: Course[] = [
  {
    id: "micro",
    name: "微休息",
    description: "2 分钟 · 工作间隙快速放松",
    steps: [
      { id: "m1", name: "颈部左右侧屈", durationSeconds: 30, ttsText: "慢慢将头倒向一侧，感受颈部拉伸", svgKey: "neck-side" },
      { id: "m2", name: "耸肩放松", durationSeconds: 30, ttsText: "双肩向上耸起，保持，然后突然放松", svgKey: "shrug" },
      { id: "m3", name: "肩部环绕", durationSeconds: 30, ttsText: "双肩向前画圈，再向后画圈", svgKey: "shoulder-roll" },
      { id: "m4", name: "开胸扩胸", durationSeconds: 30, ttsText: "双手在背后交叉，向后伸展，打开胸腔", svgKey: "chest-open" },
    ],
  },
  {
    id: "standard",
    name: "标准课程",
    description: "5 分钟 · 午休后或疲劳时",
    steps: [
      { id: "s1", name: "颈部左右侧屈", durationSeconds: 40, ttsText: "慢慢将头倒向右侧，感受左侧颈部的拉伸", svgKey: "neck-side" },
      { id: "s2", name: "头部左右转动", durationSeconds: 30, ttsText: "缓慢地将头转向一侧，眼睛看向肩膀方向", svgKey: "neck-turn" },
      { id: "s3", name: "耸肩放松", durationSeconds: 30, ttsText: "双肩向上耸到最高点，保持3秒，然后完全放松", svgKey: "shrug" },
      { id: "s4", name: "肩部环绕", durationSeconds: 40, ttsText: "用肩膀画最大的圆，先向前5圈，再向后5圈", svgKey: "shoulder-roll" },
      { id: "s5", name: "扩胸后拉", durationSeconds: 30, ttsText: "双手在背后交叉，肩胛骨向中间夹紧", svgKey: "chest-open" },
      { id: "s6", name: "收下巴", durationSeconds: 30, ttsText: "收下巴让头部向后水平移动，保持后脑贴墙的感觉", svgKey: "chin-tuck" },
      { id: "s7", name: "手臂上举拉伸", durationSeconds: 40, ttsText: "双臂向上伸直，十指交叉，掌心向上推", svgKey: "arm-raise" },
      { id: "s8", name: "站姿侧身拉伸", durationSeconds: 40, ttsText: "右手扶左耳，轻轻将头向右拉，换边重复", svgKey: "neck-side" },
    ],
  },
  {
    id: "deep",
    name: "深度放松",
    description: "10 分钟 · 一天结束后的完整放松",
    steps: [
      { id: "d1", name: "颈部左右侧屈", durationSeconds: 40, ttsText: "慢慢将头倒向一侧，感受颈部拉伸", svgKey: "neck-side" },
      { id: "d2", name: "头部左右转动", durationSeconds: 40, ttsText: "缓慢地将头转向一侧，眼睛看向肩膀方向", svgKey: "neck-turn" },
      { id: "d3", name: "颈部旋转拉伸", durationSeconds: 40, ttsText: "头和肩保持不动，缓慢地将头向一侧倾斜并稍向前", svgKey: "neck-stretch" },
      { id: "d4", name: "耸肩放松", durationSeconds: 40, ttsText: "双肩向上耸到最高点，保持，然后完全放松", svgKey: "shrug" },
      { id: "d5", name: "肩部环绕", durationSeconds: 40, ttsText: "用肩膀画最大的圆", svgKey: "shoulder-roll" },
      { id: "d6", name: "扩胸后拉", durationSeconds: 40, ttsText: "双手在背后交叉，肩胛骨向中间夹紧", svgKey: "chest-open" },
      { id: "d7", name: "肩胛骨挤压", durationSeconds: 40, ttsText: "两肩向后拉，感受背部肌肉的发力", svgKey: "scapula-squeeze" },
      { id: "d8", name: "收下巴", durationSeconds: 30, ttsText: "收下巴让头部向后移动，矫正头前倾", svgKey: "chin-tuck" },
      { id: "d9", name: "手臂上举拉伸", durationSeconds: 40, ttsText: "双臂向上伸直，十指交叉，掌心向上推", svgKey: "arm-raise" },
      { id: "d10", name: "站姿侧身拉伸", durationSeconds: 40, ttsText: "右手扶左耳，轻轻将头向右拉，换边重复", svgKey: "neck-side" },
      { id: "d11", name: "胸椎旋转", durationSeconds: 40, ttsText: "保持下肢稳定，上身缓慢向一侧旋转", svgKey: "torso-twist" },
      { id: "d12", name: "全身舒展收尾", durationSeconds: 40, ttsText: "深呼吸，缓慢放松全身肌肉", svgKey: "full-stretch" },
    ],
  },
];
