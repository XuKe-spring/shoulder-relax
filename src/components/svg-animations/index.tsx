export { ExerciseAnimation } from "./ExerciseAnimation";
export { ExerciseModel3D } from "./ExerciseModel3D";

import { ExerciseModel3D } from "./ExerciseModel3D";
import type { FC } from "react";

type AnimProps = { playing: boolean };

export const svgComponents: Record<string, FC<AnimProps>> = {
  "neck-side": (p) => <ExerciseModel3D type="neck-side" playing={p.playing} title="颈部侧屈" />,
  "neck-turn": (p) => <ExerciseModel3D type="neck-turn" playing={p.playing} title="头部转动" />,
  "neck-stretch": (p) => <ExerciseModel3D type="neck-stretch" playing={p.playing} title="颈部拉伸" />,
  "shrug": (p) => <ExerciseModel3D type="shrug" playing={p.playing} title="耸肩放松" />,
  "shoulder-roll": (p) => <ExerciseModel3D type="shoulder-roll" playing={p.playing} title="肩部环绕" />,
  "chest-open": (p) => <ExerciseModel3D type="chest-open" playing={p.playing} title="扩胸后拉" />,
  "scapula-squeeze": (p) => <ExerciseModel3D type="scapula-squeeze" playing={p.playing} title="肩胛挤压" />,
  "chin-tuck": (p) => <ExerciseModel3D type="chin-tuck" playing={p.playing} title="收下巴" />,
  "arm-raise": (p) => <ExerciseModel3D type="arm-raise" playing={p.playing} title="手臂上举" />,
  "torso-twist": (p) => <ExerciseModel3D type="torso-twist" playing={p.playing} title="胸椎旋转" />,
  "full-stretch": (p) => <ExerciseModel3D type="full-stretch" playing={p.playing} title="全身舒展" />,
};
