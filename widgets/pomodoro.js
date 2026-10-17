// Pomodoro widget: focus for 25 min, break for 5, repeat.
//
// State lives on `this`:
//   this.mode        "focus" or "break"
//   this.remaining   seconds left on the current timer
//   this.intervalId  the id setInterval gave back, or null when paused
//   this.sessions    how many focus sessions are finished

window.Widgets = window.Widgets || {};

Widgets.pomodoro = {
  start(el) {
    // Falls back to 25/5 if config.js doesn't set them.
    this.durations = {
      focus: (CONFIG.focusMinutes ?? 25) * 60,
      break: (CONFIG.breakMinutes ?? 5) * 60,
    };

    el.innerHTML = `
      <div class="pomo__mode"></div>
      <div class="pomo__time"></div>
      <div class="pomo__buttons">
        <button class="pomo__toggle"></button>
        <button class="pomo__reset">Reset</button>
      </div>
      <div class="pomo__sessions muted"></div>
    `;
    this.el = el;
    this.modeEl = el.querySelector(".pomo__mode");
    this.timeEl = el.querySelector(".pomo__time");
    this.toggleBtn = el.querySelector(".pomo__toggle");
    this.sessionsEl = el.querySelector(".pomo__sessions");

    this.toggleBtn.addEventListener("click", () => this.toggle());
    el.querySelector(".pomo__reset").addEventListener("click", () => this.reset());

    this.mode = "focus";
    this.sessions = 0;
    this.intervalId = null;
    this.reset();
  },

  // Stop the timer and put the current mode back to full time.
  reset() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.remaining = this.durations[this.mode];
    this.render();
  },

  render() {
    this.modeEl.textContent = this.mode;
    this.timeEl.textContent = formatTime(this.remaining);
    this.toggleBtn.textContent = this.intervalId === null ? "Start" : "Pause";
    this.sessionsEl.textContent = `Sessions: ${this.sessions}`;
    this.el.classList.toggle("pomo--break", this.mode === "break");
  },

  // Start or pause. The arrow function keeps `this` pointing at the widget.
  toggle() {
    if (this.intervalId === null) {
      this.intervalId = setInterval(() => this.tick(), 1000);
    } else {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.render();
  },

  // Once a second while running: count down, switch modes at 0.
  tick() {
    if (this.remaining !== 0) {
      this.remaining -= 1;
    } else {
      this.switchMode();
    }
    this.render();
  },

  // Flip focus ↔ break. The timer keeps running, so the next one starts on its own.
  switchMode() {
    if (this.mode === "focus") this.sessions += 1;

    this.mode = this.mode === "focus" ? "break" : "focus";
    this.remaining = this.durations[this.mode];
  },
};

// Seconds → "MM:SS", e.g. 65 → "01:05".
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}
