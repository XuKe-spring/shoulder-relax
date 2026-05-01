import type { AIReport, PoseDeviationCounts } from "../types";
import type { PoseSample } from "./pose-analysis";

const API_BASE = "https://api.deepseek.com/v1/chat/completions";

function buildPrompt(
  courseName: string,
  durationMin: number,
  score: number,
  deviations: PoseDeviationCounts,
  samples: PoseSample[]
): string {
  const total = deviations.shoulderShrug + deviations.slouch + deviations.forwardHead;
  const shrugPct = total > 0 ? Math.round((deviations.shoulderShrug / total) * 100) : 0;
  const slouchPct = total > 0 ? Math.round((deviations.slouch / total) * 100) : 0;
  const headPct = total > 0 ? Math.round((deviations.forwardHead / total) * 100) : 0;

  // 采样趋势
  const half = Math.floor(samples.length / 2);
  const firstHalf = samples.slice(0, half);
  const secondHalf = samples.slice(half);
  const countDeviations = (arr: PoseSample[]) => {
    let s = 0;
    for (const sp of arr) s += sp.deviations.shoulderShrug + sp.deviations.slouch + sp.deviations.forwardHead;
    return s;
  };
  const firstCount = countDeviations(firstHalf);
  const secondCount = countDeviations(secondHalf);
  const trend = secondCount < firstCount ? "改善" : secondCount > firstCount ? "退步" : "持平";

  return `你是一位专业的运动康复师和体态矫正教练。请根据以下训练数据分析用户的肩颈姿态问题，用中文回复，语气温暖而专业。

## 训练概况
- 课程：${courseName}
- 训练时长：${durationMin} 分钟
- 姿态评分：${score} 分（满分100）
- 训练过程中偏差趋势：${trend}

## 三类偏差出现频率
- 耸肩：${deviations.shoulderShrug} 次（占 ${shrugPct}%）
- 驼背：${deviations.slouch} 次（占 ${slouchPct}%）
- 头前倾：${deviations.forwardHead} 次（占 ${headPct}%）

## 说明
耸肩 = 肩膀向上提起偏离基准位置
驼背 = 肩膀相对髋部向前偏移
头前倾 = 头部相对肩膀向前探出

请按以下 JSON 格式回复（不要包含其他文字）：
{
  "summary": "一句话总结本次训练（15字左右）",
  "mainIssue": "最主要的问题名称（如：头前倾 / 肩颈紧张 / 驼背 / 姿势良好）",
  "mainIssueDesc": "这个问题的具体表现和影响（30字左右）",
  "suggestion": "接下来的改善建议和具体可操作的方法（40字左右）",
  "encouragement": "一句鼓励的话（15字左右）"
}`;
}

export async function fetchAIReport(
  apiKey: string,
  courseName: string,
  durationMin: number,
  score: number,
  deviations: PoseDeviationCounts,
  samples: PoseSample[]
): Promise<AIReport | null> {
  if (!apiKey) return null;

  const prompt = buildPrompt(courseName, durationMin, score, deviations, samples);

  try {
    const resp = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一位专业运动康复师。只回复 JSON，不要加任何额外文字。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!resp.ok) {
      console.warn("DeepSeek API 返回错误:", resp.status);
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    // 尝试解析 JSON（可能被 markdown 代码块包裹）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const report: AIReport = JSON.parse(jsonMatch[0]);
    return report;
  } catch (err) {
    console.warn("DeepSeek API 调用失败:", err);
    return null;
  }
}
