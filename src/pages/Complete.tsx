import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getStreak } from "../utils/storage";
import type { DeviationType, AIReport } from "../types";

const DEVIATION_NAMES: Record<DeviationType, string> = {
  shoulderShrug: "耸肩",
  slouch: "驼背",
  forwardHead: "头前倾",
};

const DEVIATION_TIPS: Record<DeviationType, string> = {
  shoulderShrug: "放松肩膀，不要提得太高",
  slouch: "挺直腰背，肩胛骨向后夹",
  forwardHead: "收下巴，保持头部在肩膀正上方",
};

export default function Complete() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    score: number;
    totalDeviations: Record<DeviationType, number>;
    completedSteps: number;
    totalSteps: number;
    durationSeconds: number;
    aiReport: AIReport | null;
  } | null;

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">
        <p>没有训练数据</p>
      </div>
    );
  }

  const { score, totalDeviations, completedSteps, durationSeconds } = state;
  const streak = getStreak();
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const hasDeviations = Object.values(totalDeviations).some((v) => v > 0);

  return (
    <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-dark-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-6">训练完成！</h1>

        <div className="text-gray-400 mb-6">
          {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
          {" · "}
          {new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-lg">
            <span className="text-gray-400">⏱ 实际时长</span>
            <span>{mins} 分 {secs} 秒</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-400">📊 姿势评分</span>
            <span className={score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400"}>
              {score} / 100
            </span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-400">📋 完成动作</span>
            <span>{completedSteps} 个</span>
          </div>
        </div>

        {hasDeviations && (
          <div className="bg-dark-700 rounded-xl p-4 mb-6 text-left">
            <p className="text-yellow-400 font-bold mb-3">⚠ 姿势提醒</p>
            {Object.entries(totalDeviations).map(([key, count]) =>
              count > 0 ? (
                <p key={key} className="text-gray-300 text-sm mb-1">
                  → {(DEVIATION_NAMES as any)[key]}出现了 {count} 次，{DEVIATION_TIPS[key as DeviationType]}
                </p>
              ) : null
            )}
          </div>
        )}

        {/* DeepSeek AI 分析报告 */}
        {state.aiReport && (
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 mb-6 text-left">
            <p className="text-indigo-300 text-xs font-bold mb-3">🤖 AI 体态分析</p>
            <p className="text-white font-bold mb-2">{state.aiReport.summary}</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-yellow-400 shrink-0">主要问题</span>
                <span className="text-gray-300">{state.aiReport.mainIssue} — {state.aiReport.mainIssueDesc}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-400 shrink-0">改善建议</span>
                <span className="text-gray-300">{state.aiReport.suggestion}</span>
              </div>
              <p className="text-indigo-300 italic mt-2">💪 {state.aiReport.encouragement}</p>
            </div>
          </div>
        )}

        {streak > 0 && (
          <div className="text-lg mb-8">
            🔥 连续打卡 <span className="text-primary-500 font-bold">{streak}</span> 天
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 font-bold"
          >
            再来一次
          </button>
          <button
            onClick={() => navigate("/history")}
            className="px-6 py-2 rounded-lg bg-dark-700 hover:bg-dark-600"
          >
            查看历史
          </button>
        </div>
      </div>
    </div>
  );
}
