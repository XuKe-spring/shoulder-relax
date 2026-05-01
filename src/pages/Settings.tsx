import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { useReminder } from "../hooks/useReminder";

const INTERVAL_OPTIONS = [
  { value: 30, label: "每 30 分钟" },
  { value: 45, label: "每 45 分钟" },
  { value: 60, label: "每 60 分钟" },
  { value: 90, label: "每 90 分钟" },
  { value: 120, label: "每 2 小时" },
];

export default function Settings() {
  const { settings, update } = useSettings();
  const { requestPermission } = useReminder(settings.reminderInterval, settings.reminderEnabled);
  const [permState, setPermState] = useState<NotificationPermission>("default");

  useEffect(() => {
    setPermState(Notification.permission);
  }, []);

  const handleToggleReminder = async () => {
    const next = !settings.reminderEnabled;
    if (next && Notification.permission === "default") {
      const granted = await requestPermission();
      setPermState(granted ? "granted" : "denied");
      if (!granted) return;
    }
    update({ reminderEnabled: next });
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">设置</h1>
          <Link to="/" className="text-primary-500 hover:text-primary-400">← 返回首页</Link>
        </div>

        <div className="space-y-6">
          {/* 提醒开关 */}
          <div className="bg-dark-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">定时提醒</div>
                <div className="text-sm text-gray-400">
                  {permState === "denied"
                    ? "通知被阻止，请在浏览器设置中允许"
                    : "到时间后浏览器弹出通知"}
                </div>
              </div>
              <button
                onClick={handleToggleReminder}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.reminderEnabled ? "bg-primary-600" : "bg-dark-600"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                    settings.reminderEnabled ? "translate-x-7" : ""
                  }`}
                />
              </button>
            </div>
            {permState === "denied" && settings.reminderEnabled && (
              <p className="text-yellow-400 text-xs mt-2">
                通知权限已被拒绝，提醒将无法弹出。请在浏览器设置中允许本网站的通知。
              </p>
            )}
          </div>

          {/* 提醒间隔 */}
          <div className="bg-dark-800 rounded-xl p-5">
            <div className="font-bold text-lg mb-3">提醒间隔</div>
            <div className="grid grid-cols-3 gap-2">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ reminderInterval: opt.value })}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    settings.reminderInterval === opt.value
                      ? "bg-primary-600 text-white"
                      : "bg-dark-700 text-gray-300 hover:bg-dark-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 语音播报 */}
          <div className="bg-dark-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">语音播报</div>
                <div className="text-sm text-gray-400">训练时朗读动作名称和指令</div>
              </div>
              <button
                onClick={() => update({ voiceEnabled: !settings.voiceEnabled })}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.voiceEnabled ? "bg-primary-600" : "bg-dark-600"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                    settings.voiceEnabled ? "translate-x-7" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* DeepSeek API Key */}
          <div className="bg-dark-800 rounded-xl p-5">
            <div className="font-bold text-lg mb-1">DeepSeek AI 分析</div>
            <div className="text-sm text-gray-400 mb-3">
              训练结束后由 AI 生成个性化体态分析报告。
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 ml-1"
              >
                获取 API Key →
              </a>
            </div>
            <input
              type="password"
              value={settings.deepseekApiKey}
              onChange={(e) => update({ deepseekApiKey: e.target.value })}
              placeholder="sk-xxxx"
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
