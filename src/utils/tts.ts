let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/** 播放短促"滴"声，用于倒计时 */
export function playBeep(frequency: number = 800, duration: number = 0.15): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // 静默失败，不影响训练流程
  }
}

/** 选择最佳中文语音 */
function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // 优先级：系统中文语音 > 任何 zh-CN > zh > 默认
  const preferred = ["Tingting", "Yaoyao", "Meijia", "Sin-ji", "Google 普通话"];
  for (const name of preferred) {
    const v = voices.find((v) => v.lang.startsWith("zh") && v.name.includes(name));
    if (v) return v;
  }

  const zhCN = voices.find((v) => v.lang === "zh-CN");
  if (zhCN) return zhCN;

  const zhAny = voices.find((v) => v.lang.startsWith("zh"));
  if (zhAny) return zhAny;

  return null;
}

export function speak(text: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  // voice 列表可能异步加载，先尝试获取
  const voices = speechSynthesis.getVoices();
  const bestVoice = voices.length > 0 ? getBestVoice() : null;

  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;   // 稍慢，更清晰
  u.pitch = 1.05;  // 略微提高，更悦耳
  u.volume = 0.9;
  if (bestVoice) u.voice = bestVoice;

  // 如果 voice 列表尚未加载，等待加载后再播
  if (voices.length === 0) {
    speechSynthesis.onvoiceschanged = () => {
      const v = getBestVoice();
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    };
  } else {
    speechSynthesis.speak(u);
  }
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
