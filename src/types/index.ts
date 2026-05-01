// 课程动作步骤
export interface CourseStep {
  id: string;
  name: string;
  durationSeconds: number;
  ttsText: string;
  svgKey: string;
}

// 课程定义
export interface Course {
  id: string;
  name: string;
  description: string;
  steps: CourseStep[];
}

// 姿态偏差计数
export interface PoseDeviationCounts {
  shoulderShrug: number;
  slouch: number;
  forwardHead: number;
}

// 姿势反馈
export interface PoseFeedback {
  level: "good" | "warn" | "bad" | "idle";
  label: string;
  detail: string;
  deviations: PoseDeviationCounts;
}

// 训练历史记录
export interface WorkoutRecord {
  date: string;
  courseId: string;
  courseName: string;
  completedSteps: number;
  totalSteps: number;
  durationSeconds: number;
  poseScore: number;
  deviations: PoseDeviationCounts;
}

// 用户设置
export interface UserSettings {
  reminderInterval: number;
  reminderEnabled: boolean;
  voiceEnabled: boolean;
  selectedCamera: string;
  deepseekApiKey: string;
}

// DeepSeek 分析报告
export interface AIReport {
  summary: string;
  mainIssue: string;
  mainIssueDesc: string;
  suggestion: string;
  encouragement: string;
}

// 姿态校准基准
export interface CalibrationData {
  shoulderY: number;
  shoulderHipOffset: number | null;
  noseShoulderOffset: number;
  tolerance?: {
    shoulderY: number;
    noseShoulder: number;
    shoulderHip: number;
  };
}

// 姿态偏差类型
export type DeviationType = "shoulderShrug" | "slouch" | "forwardHead";

// 姿势状态
export type PoseStatus = "good" | "warning" | "bad";
