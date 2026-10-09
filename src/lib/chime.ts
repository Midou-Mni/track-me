/**
 * Web Audio API gentle synthesizer chimes for Pomodoro transitions.
 * Zero external audio files required — pure browser audio synthesis.
 */

export function playFocusCompleteChime(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    
    // Soothing two-tone bell chime (E5 -> B5)
    const notes = [659.25, 987.77]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25)
      
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.25)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.25 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 1.2)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(ctx.currentTime + i * 0.25)
      osc.stop(ctx.currentTime + i * 0.25 + 1.3)
    })
  } catch {
    // AudioContext blocked or not supported
  }
}

export function playBreakCompleteChime(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    
    // Gentle ascending chime (G4 -> C5)
    const notes = [392.0, 523.25]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2)
      
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.2 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 1.0)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(ctx.currentTime + i * 0.2)
      osc.stop(ctx.currentTime + i * 0.2 + 1.1)
    })
  } catch {
    // silent
  }
}
