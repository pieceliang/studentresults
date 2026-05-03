const getCtx = () => {
  if (!window._audioCtx) {
    window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._audioCtx;
};

const tone = (freq, duration, type = "sine", volume = 0.25, delay = 0) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  } catch (_) {}
};

// Happy ascending chime - used when student is saved/added
export const playSuccess = () => {
  tone(523.25, 0.2, "sine", 0.25, 0);
  tone(659.25, 0.2, "sine", 0.25, 0.1);
  tone(783.99, 0.3, "sine", 0.3, 0.2);
};

// Descending whoosh - used when student is deleted
export const playDelete = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch (_) {}
};

// Soft pop - used when opening form
export const playOpen = () => {
  tone(700, 0.1, "sine", 0.15, 0);
  tone(900, 0.1, "sine", 0.12, 0.07);
};

// Light click - generic button click
export const playClick = () => {
  tone(900, 0.07, "sine", 0.12, 0);
};

// Error buzz - validation failure
export const playError = () => {
  tone(220, 0.18, "sawtooth", 0.2, 0);
  tone(180, 0.18, "sawtooth", 0.15, 0.2);
};
