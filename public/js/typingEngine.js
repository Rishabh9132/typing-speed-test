// Reusable typing logic shared by the speed test and the lesson player.
// Renders per-character feedback into `display`, reads from a hidden `input`,
// tracks stats, and fires callbacks. Two modes:
//   'timed'    — counts down from `duration`, finishes at 0 or on full completion
//   'complete' — no countdown, finishes when the whole target is typed
export class TypingEngine {
  constructor({ target, display, input, mode = 'complete', duration = 60,
                onTick, onProgress, onComplete }) {
    this.target = target;
    this.display = display;
    this.input = input;
    this.mode = mode;
    this.duration = duration;
    this.onTick = onTick;
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    this.started = false;
    this.finished = false;
    this.startTime = 0;
    this.timeLeft = duration;
    this.timerId = null;

    this._onInput = this._handleInput.bind(this);
    this.input.addEventListener('input', this._onInput);
    this.input.value = '';
    this.input.disabled = false;
    this.render();
    this._emitProgress();
  }

  destroy() {
    this.input.removeEventListener('input', this._onInput);
    clearInterval(this.timerId);
  }

  _handleInput() {
    if (this.finished) return;
    if (!this.started) this._start();
    this.render();
    this._emitProgress();
    if (this.input.value.length >= this.target.length) this.finish();
  }

  _start() {
    this.started = true;
    this.startTime = Date.now();
    if (this.mode === 'timed') {
      this.timerId = setInterval(() => {
        this.timeLeft -= 1;
        if (this.onTick) this.onTick(this.timeLeft);
        if (this.timeLeft <= 0) this.finish();
      }, 1000);
    }
  }

  // Compute correct/incorrect/typed counts and derived stats.
  stats() {
    const typed = this.input.value;
    let correct = 0;
    let errors = 0;
    for (let i = 0; i < typed.length; i++) {
      if (i < this.target.length && typed[i] === this.target[i]) correct++;
      else errors++;
    }
    const elapsedSec = this.started ? Math.max((Date.now() - this.startTime) / 1000, 1 / 60)
      : (this.mode === 'timed' ? 0 : 1 / 60);
    const minutes = this.mode === 'timed'
      ? Math.max((this.duration - this.timeLeft) / 60, 1 / 60)
      : elapsedSec / 60;
    const wpm = Math.round((correct / 5) / minutes) || 0;
    const cpm = Math.round(correct / minutes) || 0;
    const accuracy = typed.length > 0 ? (correct / typed.length) * 100 : 100;
    return { correct, errors, typed: typed.length, wpm, cpm, accuracy };
  }

  nextChar() {
    return this.target[this.input.value.length];
  }

  render() {
    const typed = this.input.value;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < this.target.length; i++) {
      const span = document.createElement('span');
      const ch = this.target[i];
      // Use the literal character (normal space included) so what is displayed
      // exactly matches what the user must type. `white-space: pre-wrap` keeps
      // spaces visible without substituting a non-breaking space.
      span.textContent = ch;
      if (i < typed.length) span.className = typed[i] === ch ? 'correct' : 'incorrect';
      else if (i === typed.length) span.className = 'current';
      else span.className = 'pending';
      frag.appendChild(span);
    }
    this.display.replaceChildren(frag);
  }

  _emitProgress() {
    if (this.onProgress) {
      this.onProgress({ ...this.stats(), nextChar: this.nextChar(), started: this.started });
    }
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    clearInterval(this.timerId);
    this.input.disabled = true;
    if (this.onComplete) this.onComplete(this.stats());
  }
}
