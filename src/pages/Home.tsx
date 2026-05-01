import { Link } from "react-router-dom";
import { courses } from "../data/courses";
import { getStreak } from "../utils/storage";

export default function Home() {
  const streak = getStreak();

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">肩颈放松</h1>
          <p className="text-gray-400 text-lg">站起来，跟着做，告别肩颈酸痛</p>
          {streak > 0 && (
            <div className="mt-3 inline-block bg-dark-800 px-4 py-1 rounded-full text-sm">
              🔥 已连续打卡 <span className="text-primary-500 font-bold">{streak}</span> 天
            </div>
          )}
        </div>

        {/* 课程卡片 */}
        <div className="space-y-4 mb-8">
          {courses.map((course) => {
            const totalMin = Math.round(
              course.steps.reduce((sum, s) => sum + s.durationSeconds, 0) / 60
            );
            return (
              <Link
                key={course.id}
                to={`/train/${course.id}`}
                className="block bg-dark-800 hover:bg-dark-700 rounded-2xl p-6 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{course.name}</h2>
                    <p className="text-gray-400 text-sm">
                      {course.description || `${course.steps.length} 个动作 · 约 ${totalMin} 分钟`}
                    </p>
                  </div>
                  <div className="text-2xl">▶</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 底部导航 */}
        <div className="flex gap-3 justify-center">
          <Link
            to="/history"
            className="px-6 py-3 bg-dark-800 hover:bg-dark-700 rounded-xl"
          >
            📊 历史记录
          </Link>
          <Link
            to="/settings"
            className="px-6 py-3 bg-dark-800 hover:bg-dark-700 rounded-xl"
          >
            ⚙ 设置
          </Link>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          所有数据存储在本地浏览器 · 摄像头图像不上传
        </p>
      </div>
    </div>
  );
}
