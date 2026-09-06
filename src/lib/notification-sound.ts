let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (required by browsers after user gesture)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Create a pleasant two-tone notification sound
  const frequencies = [880, 1100];
  const durations = [0.08, 0.12];
  const delays = [0, 0.1];

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, now + delays[i]);
    gain.gain.linearRampToValueAtTime(0.3, now + delays[i] + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delays[i] + durations[i]);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + delays[i]);
    osc.stop(now + delays[i] + durations[i] + 0.01);
  });
}
