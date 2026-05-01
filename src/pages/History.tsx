import { useState } from "react";
import { Link } from "react-router-dom";
import { loadHistory, getStreak } from "../utils/storage";
import type { WorkoutRecord } from "../types";

function getWeekStats() {
  const history = loadHistory();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekRecords = history.filter((r) => new Date(r.date) >= weekStart);
  const monthRecords = history.filter((r) => new Date(r.date) >= monthStart);
  const totalMin = history.reduce((sum, r) => sum + r.durationSeconds, 0) / 60;

  return {
    week: weekRecords.length,
    month: monthRecords.length,
    totalMin: Math.round(totalMin),
    streak: getStreak(),
    weekData: getLast7Days(history),
  };
}

function getLast7Days(history: WorkoutRecord[]) {
  const days: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(history.filter((r) => r.date.slice(0, 10) === key).length);
  }
  return days;
}

function CalendarHeatmap() {
  const history = loadHistory();
  const dateMap = new Map<string, number>();
  history.forEach((r) => {
    const key = r.date.slice(0, 10);
    dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
  });

  // Show last 4 weeks
  const weeks: { date: string; label: string; count: number }[][] = [];
  const today = new Date();
  for (let w = 3; w >= 0; w--) {
    const week: { date: string; label: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + (6 - d)));
      const key = date.toISOString().slice(0, 10);
      week.push({
        date: key,
        label: date.toLocaleDateString("zh-CN", { weekday: "short" }),
        count: dateMap.get(key) ?? 0,
      });
    }
    weeks.push(week);
  }

  const dayNames = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <div className="bg-dark-800 rounded-xl p-6">
      <h2 className="text-lg font-bold mb-4">打卡日历</h2>
      <div className="flex gap-1 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="w-8 text-center text-xs text-gray-500">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex gap-1 mb-1">
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count}次训练`}
              className={`w-8 h-8 rounded text-xs flex items-center justify-center ${
                day.count >= 3 ? "bg-green-600" :
                day.count >= 2 ? "bg-green-700" :
                day.count >= 1 ? "bg-green-800" :
                "bg-dark-700"
              }`}
            >
              {day.count > 0 ? day.count : ""}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function History() {
  const [history] = useState(loadHistory);
  const stats = getWeekStats();

  const maxBar = Math.max(1, ...stats.weekData);

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">训练历史</h1>
          <Link to="/" className="text-primary-500 hover:text-primary-400">← 返回首页</Link>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500">{stats.week}</div>
            <div className="text-xs text-gray-400 mt-1">本周训练</div>
          </div>
          <div className="bg-dark-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{stats.month}</div>
            <div className="text-xs text-gray-400 mt-1">本月训练</div>
          </div>
          <div className="bg-dark-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{stats.totalMin}</div>
            <div className="text-xs text-gray-400 mt-1">累计分钟</div>
          </div>
          <div className="bg-dark-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.streak}</div>
            <div className="text-xs text-gray-400 mt-1">连续打卡</div>
          </div>
        </div>

        {/* 近7天柱状图 */}
        <div className="bg-dark-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">近 7 天训练次数</h2>
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.weekData.map((count, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary-600 rounded-t"
                    style={{ height: `${(count / maxBar) * 100}%`, minHeight: count > 0 ? 8 : 0 }}
                  />
                  <span className="text-xs text-gray-500">
                    {d.toLocaleDateString("zh-CN", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 打卡日历 */}
        <CalendarHeatmap />

        {/* 历史记录列表 */}
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-bold mb-4">全部记录</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无训练记录</p>
          ) : (
            history.map((record, i) => (
              <div key={i} className="bg-dark-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{record.courseName}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(record.date).toLocaleDateString("zh-CN")} ·{" "}
                    {Math.floor(record.durationSeconds / 60)}分{record.durationSeconds % 60}秒
                  </div>
                </div>
                <div className={`text-xl font-bold ${
                  record.poseScore >= 80 ? "text-green-400" :
                  record.poseScore >= 60 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {record.poseScore}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
