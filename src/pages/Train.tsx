import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { courses } from "../data/courses";
import { useTimer } from "../hooks/useTimer";
import { usePose } from "../hooks/usePose";
import { svgComponents } from "../components/svg-animations";
import { speak, stopSpeaking } from "../utils/tts";
import { saveRecord, loadSettings } from "../utils/storage";
import { fetchAIReport } from "../utils/deepseek";
import { getPoseSamples, clearPoseSamples } from "../utils/pose-analysis";
import type { PoseDeviationCounts, PoseFeedback, AIReport } from "../types";

const emptyDeviations = (): PoseDeviationCounts => ({ shoulderShrug: 0, slouch: 0, forwardHead: 0 });
const addDeviations = (a: PoseDeviationCounts, b: PoseDeviationCounts): PoseDeviationCounts => ({
  shoulderShrug: a.shoulderShrug + b.shoulderShrug,
  slouch: a.slouch + b.slouch,
  forwardHead: a.forwardHead + b.forwardHead,
});

const FEEDBACK_LABEL_COLOR: Record<string, string> = {
  good: "text-green-400",
  warn: "text-yellow-400",
  bad: "text-red-400",
  idle: "text-gray-400",
};

export default function Train() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const course = courses.find((c) => c.id === id);

  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [calibrationCountdown, setCalibrationCountdown] = useState(3);
  const [totalDeviations, setTotalDeviations] = useState<PoseDeviationCounts>(emptyDeviations);
  const lastAccumulatedAt = useRef(0);

  const { remaining, running, start, pause: pauseTimer, resume: resumeTimer } = useTimer();
  const {
    videoRef,
    canvasRef,
    calibration,
    calibrating,
    feedback,
    cameraState,
    startCamera,
    stopCamera,
    startCalibration,
  } = usePose();

  const step = course?.steps[stepIndex];
  const isTraining = !calibrating && calibration && !paused;

  // 累积偏差（节流：每 2 秒一次）
  const handleFeedback = useCallback((fb: PoseFeedback) => {
    const now = Date.now();
    if (now - lastAccumulatedAt.current > 1900) {
      lastAccumulatedAt.current = now;
      setTotalDeviations((prev) => addDeviations(prev, fb.deviations));
    }
  }, []);

  // 监听 feedback 变化来累积
  useEffect(() => {
    handleFeedback(feedback);
  }, [feedback, handleFeedback]);

  // 校准倒计时
  useEffect(() => {
    if (!calibrating || paused) return;
    if (calibrationCountdown <= 0) return;
    const id = setInterval(() => {
      setCalibrationCountdown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [calibrating, paused, calibrationCountdown]);

  // 开始当前动作的计时
  const beginStep = useCallback(
    (idx: number) => {
      const s = course?.steps[idx];
      if (!s) return;
      start(s.durationSeconds);
      speak(s.ttsText);
    },
    [course, start]
  );

  // 初始化摄像头
  useEffect(() => {
    if (!course) return;
    startCamera();
    return () => { stopCamera(); stopSpeaking(); };
  }, [course, startCamera, stopCamera]);

  // 摄像头就绪后开始校准
  useEffect(() => {
    if (cameraState === "ready" && !calibration) {
      startCalibration();
    }
  }, [cameraState, calibration, startCalibration]);

  // 校准完成开始训练
  useEffect(() => {
    if (calibration && !calibrating && !running) {
      beginStep(stepIndex);
    }
  }, [calibration, calibrating]);

  // 倒计时结束 → 下一个
  useEffect(() => {
    if (remaining > 0 || !running) return;
    if (stepIndex < (course?.steps.length ?? 0) - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      beginStep(next);
    } else {
      finishTraining();
    }
  }, [remaining, running]);

  const goNext = () => {
    if (stepIndex < (course?.steps.length ?? 0) - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      beginStep(next);
    } else {
      finishTraining();
    }
  };

  const goPrev = () => {
    if (stepIndex > 0) {
      const prev = stepIndex - 1;
      setStepIndex(prev);
      beginStep(prev);
    }
  };

  const togglePause = () => {
    setPaused((p) => {
      if (p) {
        resumeTimer();
      } else {
        pauseTimer();
      }
      return !p;
    });
  };

  const finishTraining = async () => {
    stopCamera();
    stopSpeaking();
    const score = Math.max(0, 100 - (totalDeviations.shoulderShrug + totalDeviations.slouch + totalDeviations.forwardHead) * 2);
    const completedSec = course!.steps.slice(0, stepIndex + 1).reduce((s, st) => s + st.durationSeconds, 0);

    saveRecord({
      date: new Date().toISOString(),
      courseId: course!.id,
      courseName: course!.name,
      completedSteps: stepIndex + 1,
      totalSteps: course!.steps.length,
      durationSeconds: completedSec,
      poseScore: score,
      deviations: totalDeviations,
    });

    // 调用 DeepSeek 生成分析报告
    const settings = loadSettings();
    const samples = getPoseSamples();
    let aiReport: AIReport | null = null;
    if (settings.deepseekApiKey && samples.length > 0) {
      aiReport = await fetchAIReport(
        settings.deepseekApiKey,
        course!.name,
        Math.round(completedSec / 60),
        score,
        totalDeviations,
        samples,
      );
    }
    clearPoseSamples();

    navigate(`/complete/${course!.id}`, {
      state: {
        score,
        totalDeviations,
        completedSteps: stepIndex + 1,
        totalSteps: course!.steps.length,
        durationSeconds: completedSec,
        aiReport,
      },
    });
  };

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white"><p>课程未找到</p></div>;
  }

  const SvgAnim = svgComponents[step?.svgKey ?? ""];

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      {/* 顶栏 */}
      <header className="flex items-center justify-between px-6 py-3 bg-dark-800 border-b border-dark-700">
        <Link to="/" className="text-sm text-gray-400 hover:text-white">← 返回</Link>
        <div className="text-sm font-bold">
          {course.name} · 动作 {stepIndex + 1}/{course.steps.length}
          {step && ` · ${step.name}`}
        </div>
        <div className="text-2xl font-mono text-primary-500">
          {!isTraining ? "--:--" : `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`}
        </div>
      </header>

      {/* 主体 */}
      <div className="flex-1 flex">
        {/* 左：标准动画 */}
        <div className="w-1/2 bg-dark-800 flex flex-col items-center justify-center p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step?.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {SvgAnim && <SvgAnim playing={isTraining} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 右：摄像头 */}
        <div className="w-1/2 relative bg-black flex flex-col">
          {cameraState === "loading" && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div>
                <p className="text-xl mb-2">正在打开摄像头…</p>
              </div>
            </div>
          )}
          {cameraState === "denied" && (
            <div className="flex-1 flex items-center justify-center text-yellow-400 p-8 text-center">
              <p>摄像头权限被拒绝。请在浏览器设置中允许摄像头访问。</p>
            </div>
          )}
          {cameraState === "error" && (
            <div className="flex-1 flex items-center justify-center text-gray-400 p-8 text-center">
              <p>无法打开摄像头。您仍可跟随左侧动画训练。</p>
            </div>
          )}

          {(cameraState === "ready") && (
            <div className="flex-1 relative">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-60" playsInline muted />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

              {/* 校准遮罩 */}
              {calibrating && (
                <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-2">站直，保持不动</p>
                    <p className="text-gray-300">正在校准你的基准姿势… {calibrationCountdown}s</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 反馈条 */}
          {cameraState === "ready" && !calibrating && (
            <div className="bg-dark-800/90 backdrop-blur px-4 py-2 border-t border-dark-700">
              <div className="flex items-center gap-3">
                <span className={`font-bold text-sm ${FEEDBACK_LABEL_COLOR[feedback.level] ?? "text-gray-400"}`}>
                  {feedback.label}
                </span>
                <span className="text-gray-400 text-xs">{feedback.detail}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底栏控制 */}
      <footer className="flex items-center justify-center gap-4 px-6 py-4 bg-dark-800 border-t border-dark-700">
        <button onClick={goPrev} disabled={stepIndex === 0}
          className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed">
          ◀ 上一个
        </button>
        <button onClick={togglePause}
          className="px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-lg font-bold">
          {paused ? "▶ 继续" : "⏸ 暂停"}
        </button>
        <button onClick={goNext}
          className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600">
          下一个 ▶
        </button>
        <button onClick={finishTraining}
          className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 ml-4">
          退出训练
        </button>
      </footer>
    </div>
  );
}
