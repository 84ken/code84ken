// Chiptune BGM + SFX engine (Web Audio)
class ChiptunePlayer {
  constructor() {
    this.ctx = null; this.playing = false;
    this.nextNoteTime = 0; this.currentNote = 0; this.timerID = null;
    this.tempo = 165; this.gainNode = null; this.currentBGM = 'title';
  }
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.15;
    this.gainNode.connect(this.ctx.destination);
  }
  getMelody() {
    const C4=261.63,D4=293.66,E4=329.63,F4=349.23,G4=392,A4=440,B4=493.88;
    const C5=523.25,D5=587.33,E5=659.25,F5=698.46,G5=784,A5=880; const R=0;
    return [
      [G4,2],[A4,1],[B4,1],[D5,2],[C5,1],[B4,1],[A4,2],[G4,2],
      [E4,2],[G4,1],[A4,1],[B4,3],[A4,1],[G4,2],[R,2],
      [C5,2],[B4,1],[C5,1],[D5,2],[E5,2],[D5,2],[C5,1],[B4,1],
      [A4,2],[B4,1],[C5,1],[D5,3],[R,1],[D5,2],[R,2],
      [E5,2],[D5,1],[E5,1],[G5,2],[E5,2],[D5,2],[C5,1],[D5,1],
      [E5,2],[C5,2],[B4,2],[A4,1],[G4,1],[A4,4],
      [B4,2],[C5,1],[D5,1],[E5,2],[D5,2],[C5,2],[B4,2],
      [G4,2],[A4,2],[B4,2],[C5,2],[D5,4],[R,4],
    ];
  }
  getBass() {
    const C3=130.81,D3=146.83,E3=164.81,F3=174.61,G3=196,A3=220,B3=246.94;
    const C4=261.63,D4=293.66,E4=329.63,G4=392; const R=0;
    return [
      [G3,2],[G4,2],[G3,2],[G4,2],[A3,2],[A3,2],[G3,2],[G3,2],
      [E3,2],[E3,2],[G3,2],[G3,2],[B3,2],[B3,2],[R,2],[G3,2],
      [C4,2],[C3,2],[C4,2],[C3,2],[E3,2],[E3,2],[D3,2],[D3,2],
      [A3,2],[A3,2],[D3,2],[D3,2],[D4,2],[D3,2],[D4,2],[R,2],
      [E3,2],[E4,2],[E3,2],[E4,2],[C3,2],[C4,2],[D3,2],[D4,2],
      [E3,2],[C3,2],[B3,2],[A3,2],[G3,2],[A3,2],[A3,2],[A3,2],
      [B3,2],[B3,2],[E3,2],[E4,2],[C3,2],[C4,2],[B3,2],[B3,2],
      [G3,2],[A3,2],[B3,2],[C4,2],[G3,4],[R,4],
    ];
  }
  getHarmony() {
    const C4=261.63,D4=293.66,E4=329.63,F4=349.23,G4=392,A4=440,B4=493.88;
    const C5=523.25,D5=587.33,E5=659.25,G5=784; const R=0;
    return [
      [B4,2],[C5,1],[D5,1],[G5,2],[E5,1],[D5,1],[C5,2],[B4,2],
      [G4,2],[B4,1],[C5,1],[D5,3],[C5,1],[B4,2],[R,2],
      [E5,2],[D5,1],[E5,1],[G5,2],[G5,2],[G5,2],[E5,1],[D5,1],
      [C5,2],[D5,1],[E5,1],[G5,3],[R,1],[G5,2],[R,2],
      [G5,2],[G5,1],[G5,1],[B4,2],[G5,2],[G5,2],[E5,1],[G5,1],
      [G5,2],[E5,2],[D5,2],[C5,1],[B4,1],[C5,4],
      [D5,2],[E5,1],[G5,1],[G5,2],[G5,2],[E5,2],[D5,2],
      [B4,2],[C5,2],[D5,2],[E5,2],[G5,4],[R,4],
    ];
  }
  getDrumPattern() {
    return [ ['kick',2],['hihat',2],['kick',2],['hihat',2], ['kick',2],['hihat',2],['kick',2],['hihat',2] ];
  }
  getBossMelody() {
    const C4=261.63,D4=293.66,Eb4=311.13,E4=329.63,F4=349.23,G4=392,Ab4=415.30,A4=440,B4=493.88;
    const C5=523.25,D5=587.33,Eb5=622.25,E5=659.25,F5=698.46,G5=784; const R=0;
    return [
      [E4,1],[E4,1],[E4,1],[R,1],[E4,1],[R,1],[G4,1],[E4,1],
      [C4,1],[E4,1],[G4,2],[Ab4,2],[G4,1],[E4,1],
      [A4,2],[A4,1],[R,1],[A4,1],[G4,1],[F4,1],[E4,1],
      [E4,2],[G4,2],[B4,2],[C5,1],[B4,1],
      [C5,1],[C5,1],[C5,1],[R,1],[C5,1],[R,1],[D5,1],[C5,1],
      [B4,1],[C5,1],[E5,2],[Eb5,2],[D5,1],[C5,1],
      [D5,2],[C5,1],[B4,1],[A4,1],[B4,1],[C5,1],[D5,1],
      [E5,2],[D5,2],[C5,2],[B4,1],[R,1],
      [E5,1],[E5,1],[D5,1],[C5,1],[B4,1],[A4,1],[G4,1],[R,1],
      [A4,2],[G4,1],[F4,1],[E4,2],[R,2],
      [E4,1],[G4,1],[B4,1],[E5,1],[D5,1],[C5,1],[B4,1],[A4,1],
      [E4,4],[R,4],
    ];
  }
  getBossBass() {
    const A2=110,B2=123.47,C3=130.81,D3=146.83,E3=164.81,F3=174.61,G3=196,Ab3=207.65,A3=220,B3=246.94;
    const C4=261.63,E4=329.63; const R=0;
    return [
      [E3,1],[E3,1],[E4,1],[E3,1],[E3,1],[E4,1],[E3,1],[E3,1],
      [C3,1],[C3,1],[C3,2],[Ab3,2],[G3,1],[E3,1],
      [A2,2],[A3,1],[A2,1],[A3,1],[G3,1],[F3,1],[E3,1],
      [E3,2],[E3,2],[B2,2],[C3,1],[B2,1],
      [C3,1],[C3,1],[C4,1],[C3,1],[C3,1],[C4,1],[D3,1],[C3,1],
      [B2,1],[C3,1],[E3,2],[E3,2],[D3,1],[C3,1],
      [D3,2],[C3,1],[B2,1],[A2,1],[B2,1],[C3,1],[D3,1],
      [E3,2],[D3,2],[C3,2],[B2,1],[R,1],
      [E3,1],[E3,1],[D3,1],[C3,1],[B2,1],[A2,1],[G3,1],[R,1],
      [A2,2],[G3,1],[F3,1],[E3,2],[R,2],
      [E3,1],[E3,1],[B2,1],[E3,1],[D3,1],[C3,1],[B2,1],[A2,1],
      [E3,4],[R,4],
    ];
  }
  getBossHarmony() {
    const C4=261.63,D4=293.66,E4=329.63,F4=349.23,G4=392,Ab4=415.30,A4=440,B4=493.88;
    const C5=523.25,D5=587.33,E5=659.25; const R=0;
    return [
      [G4,1],[G4,1],[G4,1],[R,1],[G4,1],[R,1],[B4,1],[G4,1],
      [E4,1],[G4,1],[B4,2],[C5,2],[B4,1],[G4,1],
      [C5,2],[C5,1],[R,1],[C5,1],[B4,1],[A4,1],[G4,1],
      [G4,2],[B4,2],[D5,2],[E5,1],[D5,1],
      [E5,1],[E5,1],[E5,1],[R,1],[E5,1],[R,1],[G4,1],[E5,1],
      [D5,1],[E5,1],[G4,2],[G4,2],[G4,1],[E4,1],
      [G4,2],[E4,1],[D4,1],[C4,1],[D4,1],[E4,1],[G4,1],
      [G4,2],[G4,2],[E4,2],[D4,1],[R,1],
      [G4,1],[G4,1],[G4,1],[E4,1],[D4,1],[C4,1],[B4,1],[R,1],
      [C5,2],[B4,1],[A4,1],[G4,2],[R,2],
      [G4,1],[B4,1],[D5,1],[G4,1],[G4,1],[E4,1],[D4,1],[C4,1],
      [G4,4],[R,4],
    ];
  }
  // FINAL BOSS BGM - fast, relentless, E minor
  getFinalMelody() {
    const G4=392,A4=440,B4=493.88,C5=523.25,D5=587.33,E5=659.25,F5=698.46,G5=784; const R=0;
    return [
      [E5,1],[R,1],[E5,1],[E5,1],[R,1],[D5,1],[E5,1],[R,1],
      [B4,1],[R,1],[B4,1],[C5,1],[B4,1],[A4,1],[B4,2],
      [C5,1],[R,1],[C5,1],[D5,1],[R,1],[C5,1],[B4,1],[A4,1],
      [G4,2],[A4,1],[B4,1],[C5,2],[B4,1],[A4,1],
      [E5,1],[R,1],[E5,1],[F5,1],[E5,1],[D5,1],[C5,1],[B4,1],
      [A4,1],[B4,1],[C5,1],[D5,1],[E5,2],[D5,1],[C5,1],
      [B4,1],[C5,1],[D5,1],[E5,1],[F5,1],[G5,2],[F5,1],
      [E5,2],[D5,2],[B4,2],[R,2],
    ];
  }
  getFinalBass() {
    const E2=82.41,G2=98,A2=110,B2=123.47,C3=130.81,D3=146.83,E3=164.81,G3=196,A3=220; const R=0;
    return [
      [E2,1],[E3,1],[E2,1],[E3,1],[E2,1],[E3,1],[E2,1],[E3,1],
      [E2,1],[E3,1],[E2,1],[E3,1],[E2,1],[E3,1],[E2,1],[E3,1],
      [A2,1],[A3,1],[A2,1],[A3,1],[A2,1],[A3,1],[A2,1],[A3,1],
      [G2,1],[G3,1],[G2,1],[G3,1],[C3,1],[G3,1],[C3,1],[G3,1],
      [E2,1],[E3,1],[E2,1],[E3,1],[E2,1],[E3,1],[E2,1],[E3,1],
      [A2,1],[A3,1],[A2,1],[A3,1],[C3,1],[C3,1],[D3,1],[D3,1],
      [B2,1],[B2,1],[D3,1],[D3,1],[G2,1],[G3,1],[G2,1],[G3,1],
      [E2,1],[B2,1],[E3,1],[B2,1],[E2,2],[R,2],
    ];
  }
  getFinalHarmony() {
    const E4=329.63,G4=392,A4=440,B4=493.88,C5=523.25; const R=0;
    return [
      [G4,2],[R,2],[G4,2],[R,2],
      [G4,2],[R,2],[G4,2],[R,2],
      [A4,2],[R,2],[A4,2],[R,2],
      [E4,2],[R,2],[E4,2],[R,2],
      [G4,2],[R,2],[G4,2],[R,2],
      [C5,2],[R,2],[A4,2],[R,2],
      [B4,2],[R,2],[B4,2],[R,2],
      [B4,2],[G4,2],[E4,2],[R,2],
    ];
  }
  // TITLE BGM - gentle lullaby, C major
  getTitleMelody() {
    const C4=261.63,D4=293.66,E4=329.63,G4=392,A4=440,B4=493.88,C5=523.25,D5=587.33,E5=659.25; const R=0;
    return [
      [E4,2],[G4,2],[C5,4],[B4,2],[A4,2],[G4,4],
      [A4,2],[C5,2],[E5,4],[D5,2],[C5,2],[D5,4],
      [E5,2],[D5,2],[C5,4],[A4,2],[G4,2],[A4,4],
      [G4,2],[E4,2],[D4,2],[E4,2],[C4,6],[R,2],
    ];
  }
  getTitleBass() {
    const C3=130.81,E3=164.81,F3=174.61,G3=196,A3=220; const R=0;
    return [
      [C3,4],[G3,4],[A3,4],[E3,4],
      [F3,4],[C3,4],[G3,4],[G3,4],
      [A3,4],[F3,4],[C3,4],[F3,4],
      [G3,4],[G3,4],[C3,6],[R,2],
    ];
  }
  getTitleHarmony() {
    const E4=329.63,F4=349.23,G4=392,A4=440; const R=0;
    return [
      [R,8],[G4,8],[R,8],[F4,8],
      [R,8],[A4,8],[R,8],[E4,8],
    ];
  }
  // GAME OVER BGM - slow, hopeful A minor → C major
  getGameOverMelody() {
    const A3=220,C4=261.63,D4=293.66,E4=329.63,G4=392,A4=440,B4=493.88,C5=523.25; const R=0;
    return [
      [A4,4],[E4,4],[A4,4],[B4,2],[C5,2],
      [B4,4],[G4,4],[E4,8],
      [A4,4],[E4,4],[D4,4],[C4,2],[D4,2],
      [E4,8],[A3,4],[R,4],
    ];
  }
  getGameOverBass() {
    const A2=110,C3=130.81,E3=164.81,F3=174.61,G3=196; const R=0;
    return [[A2,8],[F3,8],[G3,8],[E3,8],[A2,8],[F3,8],[C3,8],[E3,4],[R,4]];
  }
  getGameOverHarmony() {
    const C4=261.63,E4=329.63,G4=392; const R=0;
    return [[R,8],[C4,8],[R,8],[E4,8],[R,8],[G4,8],[R,8],[E4,8]];
  }
  playSquare(freq, startTime, duration, type='square') {
    if (!this.ctx || freq === 0) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    env.gain.setValueAtTime(0.3, startTime);
    env.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.9);
    osc.connect(env); env.connect(this.gainNode);
    osc.start(startTime); osc.stop(startTime + duration);
  }
  playDrum(type, startTime) {
    if (!this.ctx) return;
    if (type === 'kick') {
      const osc = this.ctx.createOscillator(); const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, startTime);
      osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.08);
      env.gain.setValueAtTime(0.4, startTime);
      env.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
      osc.connect(env); env.connect(this.gainNode);
      osc.start(startTime); osc.stop(startTime + 0.12);
    } else if (type === 'hihat') {
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 8000;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.1, startTime);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);
      noise.connect(filter); filter.connect(env); env.connect(this.gainNode);
      noise.start(startTime); noise.stop(startTime + 0.05);
    }
  }
  playBGM(kind) {
    const tempos = { title: 96, battle: 165, boss: 180, final: 200, gameover: 70 };
    const changed = this.currentBGM !== kind;
    this.currentBGM = kind;
    this.tempo = tempos[kind] || 165;
    if (this.playing && changed) this.restart();
  }
  playBattleBGM() { this.playBGM('battle'); }
  playBossBGM() { this.playBGM('boss'); }
  restart() { this.stop(); this.start(); }
  start() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.playing = true; this.currentNote = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.schedule();
  }
  schedule() {
    if (!this.playing) return;
    let melody, bass, harmony, drums = this.getDrumPattern();
    if (this.currentBGM === 'boss') { melody = this.getBossMelody(); bass = this.getBossBass(); harmony = this.getBossHarmony(); }
    else if (this.currentBGM === 'final') { melody = this.getFinalMelody(); bass = this.getFinalBass(); harmony = this.getFinalHarmony(); }
    else if (this.currentBGM === 'title') { melody = this.getTitleMelody(); bass = this.getTitleBass(); harmony = this.getTitleHarmony(); drums = [['rest',4]]; }
    else if (this.currentBGM === 'gameover') { melody = this.getGameOverMelody(); bass = this.getGameOverBass(); harmony = this.getGameOverHarmony(); drums = [['rest',4]]; }
    else { melody = this.getMelody(); bass = this.getBass(); harmony = this.getHarmony(); }
    const secPer16th = 60 / this.tempo / 4;
    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      const [mFreq, mDur] = melody[this.currentNote % melody.length];
      const [bFreq] = bass[this.currentNote % bass.length];
      const [hFreq, hDur] = harmony[this.currentNote % harmony.length];
      const [dType] = drums[this.currentNote % drums.length];
      this.playSquare(mFreq, this.nextNoteTime, mDur * secPer16th * 0.9, 'square');
      this.playSquare(bFreq, this.nextNoteTime, mDur * secPer16th * 0.8, 'triangle');
      if (hFreq > 0) {
        const osc = this.ctx.createOscillator(); const env = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = hFreq;
        env.gain.setValueAtTime(0.12, this.nextNoteTime);
        env.gain.exponentialRampToValueAtTime(0.01, this.nextNoteTime + hDur * secPer16th * 0.7);
        osc.connect(env); env.connect(this.gainNode);
        osc.start(this.nextNoteTime); osc.stop(this.nextNoteTime + hDur * secPer16th);
      }
      if (dType !== 'rest') this.playDrum(dType, this.nextNoteTime);
      this.nextNoteTime += mDur * secPer16th;
      this.currentNote++;
    }
    this.timerID = setTimeout(() => this.schedule(), 50);
  }
  stop() { this.playing = false; if (this.timerID) clearTimeout(this.timerID); }

  playSfx(type) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;
    osc.connect(gain); gain.connect(this.ctx.destination);
    if (type === 'correct') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.08);
      osc.frequency.setValueAtTime(784, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.35);
    } else if (type === 'victory') {
      osc.type = 'square';
      [523,587,659,784].forEach((f,i) => osc.frequency.setValueAtTime(f, now + i * 0.12));
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'bossClear') {
      osc.type = 'square';
      [523,587,659,784,880,784,880,1047].forEach((f,i) => osc.frequency.setValueAtTime(f, now + i * 0.15));
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
      osc.start(now); osc.stop(now + 1.4);
      const osc2 = this.ctx.createOscillator(); const gain2 = this.ctx.createGain();
      osc2.type = 'triangle'; gain2.gain.value = 0.15;
      osc2.connect(gain2); gain2.connect(this.ctx.destination);
      [392,440,494,523,659,523,659,784].forEach((f,i) => osc2.frequency.setValueAtTime(f, now + i * 0.15));
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
      osc2.start(now); osc2.stop(now + 1.4);
    } else if (type === 'levelup') {
      osc.type = 'square';
      [392,440,494,523,587,659,784,880].forEach((f,i) => osc.frequency.setValueAtTime(f, now + i * 0.08));
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.start(now); osc.stop(now + 0.8);
    } else if (type === 'select') {
      osc.type = 'square'; osc.frequency.value = 600;
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'blip') {
      osc.type = 'square'; osc.frequency.value = 340 + Math.random() * 120;
      gain.gain.value = 0.06;
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.045);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'slash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.22);
    } else if (type === 'crit') {
      osc.type = 'square';
      [880,1174,1568].forEach((f,i) => osc.frequency.setValueAtTime(f, now + i * 0.07));
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'hurt') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'heal') {
      osc.type = 'triangle';
      [523,659,784,1047].forEach((f,i) => osc.frequency.setValueAtTime(f, now + i * 0.09));
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'spare') {
      osc.type = 'triangle';
      [659,784,880,1047,1319].forEach((f,i) => osc.frequency.setValueAtTime(f, now + i * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.start(now); osc.stop(now + 0.7);
    } else if (type === 'buy') {
      osc.type = 'square';
      [988,1319].forEach((f,i) => osc.frequency.setValueAtTime(f, now + i * 0.09));
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'gameover') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
      osc.start(now); osc.stop(now + 1);
    } else if (type === 'bossAppear') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      osc.frequency.setValueAtTime(80, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.7);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc.start(now); osc.stop(now + 0.9);
    }
  }
}

const music = new ChiptunePlayer();

// ===================================================================
// Undertale-style SFX (added in v4)
// ===================================================================
ChiptunePlayer.prototype._tone = function (type, freqs, step, dur, vol, dest) {
  this.init();
  if (this.ctx.state === 'suspended') this.ctx.resume();
  const now = this.ctx.currentTime;
  const osc = this.ctx.createOscillator();
  const g = this.ctx.createGain();
  osc.type = type;
  freqs.forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * step));
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(g); g.connect(dest || this.ctx.destination);
  osc.start(now); osc.stop(now + dur + 0.02);
};
ChiptunePlayer.prototype._noise = function (dur, vol, fromHz, toHz, type) {
  this.init();
  if (this.ctx.state === 'suspended') this.ctx.resume();
  const now = this.ctx.currentTime;
  const len = Math.floor(this.ctx.sampleRate * dur);
  const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = this.ctx.createBufferSource(); src.buffer = buf;
  const f = this.ctx.createBiquadFilter();
  f.type = type || 'bandpass';
  f.frequency.setValueAtTime(fromHz, now);
  f.frequency.exponentialRampToValueAtTime(toHz, now + dur);
  const g = this.ctx.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(f); f.connect(g); g.connect(this.ctx.destination);
  src.start(now); src.stop(now + dur);
};
// character voice blip; pitch differs per speaker
ChiptunePlayer.prototype.voice = function (pitch, wave) {
  this._tone(wave || 'square', [pitch * (0.97 + Math.random() * 0.06)], 1, 0.045, 0.05);
};
ChiptunePlayer.prototype.fx = function (type) {
  switch (type) {
    case 'move':      this._tone('square', [880], 1, 0.04, 0.06); break;
    case 'confirm':   this._tone('square', [660, 990], 0.035, 0.09, 0.08); break;
    case 'back':      this._tone('square', [520, 390], 0.035, 0.08, 0.06); break;
    case 'encounter': this._tone('square', [1320], 1, 0.07, 0.12); break;
    case 'soulFly':   this._tone('triangle', [300, 600, 900, 1200], 0.05, 0.25, 0.12); break;
    case 'slash':     this._noise(0.22, 0.35, 5000, 400, 'bandpass'); this._tone('sawtooth', [1100, 300], 0.08, 0.2, 0.12); break;
    case 'hitEnemy':  this._tone('square', [180, 120, 90], 0.04, 0.22, 0.25); this._noise(0.15, 0.25, 1500, 200, 'lowpass'); break;
    case 'crit':      this._tone('square', [880, 1175, 1568, 2093], 0.05, 0.35, 0.22); break;
    case 'hurt':      this._tone('square', [420, 180, 90], 0.03, 0.16, 0.25); this._noise(0.1, 0.2, 2000, 300, 'lowpass'); break;
    case 'dust':      this._noise(1.1, 0.3, 6000, 300, 'highpass'); break;
    case 'poof':      this._noise(0.4, 0.25, 900, 3000, 'bandpass'); this._tone('triangle', [660, 880, 1320], 0.07, 0.4, 0.12); break;
    case 'crack':     this._tone('square', [1200, 160], 0.02, 0.18, 0.3); this._noise(0.12, 0.3, 3000, 800, 'highpass'); break;
    case 'shatter':   this._noise(0.5, 0.35, 8000, 800, 'highpass'); this._tone('square', [300, 200, 140, 100], 0.05, 0.35, 0.18); break;
    case 'spareOk':   this._tone('triangle', [784, 988, 1175], 0.07, 0.3, 0.14); break;
    case 'save':      this._tone('triangle', [1047, 1319, 1568, 2093], 0.06, 0.5, 0.14); break;
    case 'bell':      this._tone('triangle', [1568, 1568], 0.12, 0.6, 0.16); break;
    case 'phase':     this._tone('sawtooth', [110, 82, 55], 0.25, 1.1, 0.3); this._noise(1.0, 0.25, 400, 60, 'lowpass'); break;
    case 'ding':      this._tone('square', [1568], 1, 0.12, 0.12); break;
    default: this.playSfx(type);
  }
};
