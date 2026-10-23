let context: AudioContext | undefined;

// Unlock audio during the submit gesture, before waiting for the Python worker.
export function prepareSuccessSound() {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume().catch(() => {});
  } catch { /* Sound is optional when Web Audio is unavailable. */ }
}

export function playSuccessSound() {
  if (!context || context.state !== 'running') return;
  try {
    const start = context.currentTime + 0.01;
    // An original, quiet ascending chime; no downloaded audio or external requests.
    [659.25, 880, 1108.73].forEach((frequency, index) => {
      const note = context!.createOscillator();
      const envelope = context!.createGain();
      const at = start + index * 0.075;
      note.type = 'sine';
      note.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(0.09, at + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.001, at + 0.36);
      envelope.gain.linearRampToValueAtTime(0, at + 0.4);
      note.connect(envelope); envelope.connect(context!.destination);
      note.onended = () => { note.disconnect(); envelope.disconnect(); };
      note.start(at); note.stop(at + 0.4);
    });
  } catch { /* Audio failures must never interrupt an accepted submission. */ }
}
