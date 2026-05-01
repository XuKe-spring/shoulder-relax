import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setOnboardingComplete } from "../utils/storage";
import { useSettings } from "../hooks/useSettings";

const STEPS = ["欢迎", "摄像头", "提醒", "完成"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [cameraOk, setCameraOk] = useState(false);
  const { update } = useSettings();
  const navigate = useNavigate();

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraOk(true);
    } catch {
      setCameraOk(false);
    }
  };

  const finish = () => {
    setOnboardingComplete();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* 进度指示器 */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  i <= step ? "bg-primary-600" : "bg-dark-700 text-gray-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-dark-600" />}
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        {step === 0 && (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">办公族专属<br />肩颈放松</h1>
            <p className="text-gray-400 mb-8 text-lg">每天几分钟，告别肩颈酸痛</p>
            <button
              onClick={() => setStep(1)}
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-lg font-bold"
            >
              开始设置
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">摄像头设置</h2>
            <p className="text-gray-400 mb-6">
              {cameraOk
                ? "摄像头已就绪 ✓"
                : "我们需要使用摄像头来检测你的姿势"}
            </p>
            {!cameraOk && (
              <button onClick={requestCamera} className="px-6 py-2 bg-primary-600 rounded-lg mb-4">
                允许摄像头
              </button>
            )}
            <div className="text-sm text-gray-500 mb-6">
              图像仅在本地处理，不会上传
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setStep(2)} className="px-6 py-2 bg-primary-600 rounded-lg">
                {cameraOk ? "看起来不错" : "跳过"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">定时提醒</h2>
            <p className="text-gray-400 mb-6">
              我们会在你工作时定时提醒你站起来活动
            </p>
            <div className="space-y-3">
              {[45, 60, 90].map((min) => (
                <button
                  key={min}
                  onClick={() => {
                    update({ reminderInterval: min, reminderEnabled: true });
                    setStep(3);
                  }}
                  className="w-full px-6 py-3 bg-dark-800 hover:bg-dark-700 rounded-lg text-left"
                >
                  每 {min} 分钟
                </button>
              ))}
              <button
                onClick={() => setStep(3)}
                className="w-full px-6 py-3 bg-dark-800 hover:bg-dark-700 rounded-lg text-left text-gray-400"
              >
                暂不设置
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">一切就绪！</h2>
            <p className="text-gray-400 mb-8">
              来试试 1 分钟的体验课程吧
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setOnboardingComplete();
                  navigate("/train/micro");
                }}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-lg font-bold"
              >
                开始体验
              </button>
              <button
                onClick={finish}
                className="px-6 py-3 bg-dark-700 hover:bg-dark-600 rounded-xl"
              >
                跳过，进入首页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
