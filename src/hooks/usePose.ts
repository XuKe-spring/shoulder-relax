import { useRef, useState, useCallback, useEffect } from "react";
import type { CalibrationData, PoseFeedback } from "../types";
import { analyzePose, computeCalibration, SmoothingBuffer } from "../utils/pose-analysis";

declare global {
  interface Window {
    Pose?: new (config?: { locateFile?: (file: string) => string }) => PoseRuntime;
  }
}

interface PoseRuntime {
  close: () => Promise<void>;
  onResults: (listener: (results: any) => void) => void;
  send: (inputs: { image: HTMLVideoElement }) => Promise<void>;
  setOptions: (options: Record<string, unknown>) => void;
}

const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
const POSE_SEND_INTERVAL = 125; // ms，帧率节流
const FEEDBACK_INTERVAL = 1800; // ms，反馈更新间隔

interface Landmark {
  x: number; y: number; z: number; visibility?: number;
}

const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
];

export function usePose() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseRef = useRef<PoseRuntime | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const baselineRef = useRef<CalibrationData | null>(null);
  const calibrationFramesRef = useRef<Landmark[][]>([]);
  const smoothRef = useRef<SmoothingBuffer>(new SmoothingBuffer(5));
  const calibratingRef = useRef(false);
  const latestLandmarksRef = useRef<Landmark[] | null>(null);
  const latestFeedbackRef = useRef<PoseFeedback | null>(null);
  const lastFeedbackAtRef = useRef(0);
  const lastPoseAtRef = useRef(0);
  const poseBusyRef = useRef(false);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [feedback, setFeedback] = useState<PoseFeedback>({
    level: "idle", label: "准备中", detail: "请站直，让上半身进入画面", deviations: { shoulderShrug: 0, slouch: 0, forwardHead: 0 },
  });
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "denied" | "error">("loading");

  const loadScript = useCallback(() =>
    new Promise<void>((resolve, reject) => {
      if (window.Pose) { resolve(); return; }
      const existing = document.querySelector("script[data-mp-pose]");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("加载失败")), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = `${CDN}/pose.js`;
      s.async = true;
      s.dataset.mpPose = "true";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("加载失败"));
      document.head.appendChild(s);
    }), []);

  const draw = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const doFrame = () => {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
      }

      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      // 绘制骨骼
      const lm = latestLandmarksRef.current;
      if (lm) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(74, 222, 128, 0.9)";
        for (const [a, b] of POSE_CONNECTIONS) {
          const fa = lm[a], fb = lm[b];
          if (!fa || !fb || (fa.visibility ?? 1) < 0.35 || (fb.visibility ?? 1) < 0.35) continue;
          ctx.beginPath();
          ctx.moveTo(fa.x * w, fa.y * h);
          ctx.lineTo(fb.x * w, fb.y * h);
          ctx.stroke();
        }
        lm.forEach((kp, i) => {
          if ((kp.visibility ?? 1) < 0.35) return;
          ctx.beginPath();
          const r = [0, 11, 12, 13, 14, 23, 24].includes(i) ? 6 : 3;
          ctx.arc(kp.x * w, kp.y * h, r, 0, Math.PI * 2);
          ctx.fillStyle = [0, 11, 12, 13, 14, 23, 24].includes(i) ? "#6aa7ff" : "#f8fafc";
          ctx.fill();
        });
        ctx.restore();

        // 画反馈文字
        const fb = latestFeedbackRef.current;
        if (fb && fb.level !== "good" && fb.level !== "idle") {
          ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
          ctx.fillRect(20, h - 60, Math.min(w - 40, 500), 42);
          ctx.fillStyle = "#f8fafc";
          ctx.font = "18px system-ui, sans-serif";
          ctx.fillText(fb.detail, 36, h - 33);
        }
      }

      // 节流发送帧
      const now = performance.now();
      if (poseRef.current && now - lastPoseAtRef.current >= POSE_SEND_INTERVAL && !poseBusyRef.current) {
        lastPoseAtRef.current = now;
        poseBusyRef.current = true;
        poseRef.current.send({ image: video })
          .catch(() => {})
          .finally(() => { poseBusyRef.current = false; });
      }

      animRef.current = requestAnimationFrame(doFrame);
    };

    animRef.current = requestAnimationFrame(doFrame);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      await loadScript();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!window.Pose) throw new Error("Pose 未加载");
      const pose = new window.Pose({ locateFile: (f: string) => `${CDN}/${f}` });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        const raw: Landmark[] = results.poseLandmarks;
        if (!raw?.length) return;

        // 平滑处理
        const lm = smoothRef.current.push(raw) ?? raw;
        latestLandmarksRef.current = lm;

        // 校准阶段（使用 ref 避免闭包过期）
        if (calibratingRef.current && !baselineRef.current) {
          calibrationFramesRef.current.push(lm);
          if (calibrationFramesRef.current.length >= 24) {
            const bl = computeCalibration(calibrationFramesRef.current);
            if (bl) {
              baselineRef.current = bl;
              setCalibration(bl);
              setCalibrating(false);
              calibratingRef.current = false;
            } else {
              // 采样不足，重新收集
              calibrationFramesRef.current = [];
            }
          }
        }

        // 定期更新反馈
        const now = Date.now();
        if (now - lastFeedbackAtRef.current >= FEEDBACK_INTERVAL) {
          const fb = analyzePose(lm, baselineRef.current);
          lastFeedbackAtRef.current = now;
          latestFeedbackRef.current = fb;
          setFeedback(fb);
        }
      });

      poseRef.current = pose;
      setCameraState("ready");
      draw();
    } catch (err: any) {
      console.error(err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setCameraState("denied");
      } else {
        setCameraState("error");
      }
    }
  }, [loadScript, draw, calibrating]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    poseRef.current?.close();
    poseRef.current = null;
  }, []);

  const startCalibration = useCallback(() => {
    calibratingRef.current = true;
    setCalibrating(true);
    calibrationFramesRef.current = [];
    smoothRef.current.reset();
    baselineRef.current = null;
    setCalibration(null);
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  return {
    videoRef, canvasRef, calibration, calibrating,
    feedback, cameraState,
    startCamera, stopCamera, startCalibration,
  };
}
