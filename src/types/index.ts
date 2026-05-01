export type AnimationKey =
  | "neckSideStretch"
  | "neckTurn"
  | "shoulderShrug"
  | "shoulderRoll"
  | "chestOpen"
  | "chinTuck"
  | "armRaise"
  | "sideStretch"
  | "neckCircle"
  | "scapulaSqueeze"
  | "thoracicRotate"
  | "fullBodyReach";

export interface CourseStep {
  name: string;
  durationSeconds: number;
  ttsText: string;
  svgAnimation: AnimationKey;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  totalSeconds: number;
  steps: CourseStep[];
}

export interface PoseDeviationCounts {
  shoulderShrug: number;
  slouch: number;
  forwardHead: number;
}

export interface PoseFeedback {
  level: "good" | "warn" | "bad" | "idle";
  label: string;
  detail: string;
  deviations: PoseDeviationCounts;
}

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

export interface UserSettings {
  reminderInterval: number;
  reminderEnabled: boolean;
  voiceEnabled: boolean;
  selectedCamera: string;
  deepseekApiKey: string;
}

export interface AIReport {
  summary: string;
  mainIssue: string;
  mainIssueDesc: string;
  suggestion: string;
  encouragement: string;
}

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

export type DeviationType = "shoulderShrug" | "slouch" | "forwardHead";
export type PoseStatus = "good" | "warning" | "bad";
