// Pomodoro widget — focus for 25 min, break for 5, repeat.
//
// Your TODOs, easiest → hardest:
//   1. formatTime()   — seconds → "MM:SS" string
//   2. render()       — push the current state onto the page
//   3. toggle()       — start/pause with setInterval / clearInterval
//   4. tick()         — count down once per second, switch modes at 0
//   5. switchMode()   — flip focus ↔ break and count finished sessions
//
// start() and reset() are finished — read reset() before doing toggle(),
// it shows how the state fields get used.
//
// State lives on `this` (same idea as this.timeEl in clock.js):
//   this.mode        "focus" or "break"
//   this.remaining   seconds left on the current timer
//   this.intervalId  the id setInterval gave back, or null when paused
//   this.sessions    how many focus sessions you've finished

window.Widgets = window.Widgets || {};

Widgets.pomodoro = {
  start(el) {
    // Falls back to 25/5 if your config.js doesn't have these yet.
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

  // FINISHED: stop the timer and put the current mode back to full time.
  reset() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.remaining = this.durations[this.mode];
    this.render();
  },

  // TODO 2: render()
  // Update the page from the state. Four things:
  //   this.modeEl.textContent     → "Focus" or "Break"
  //   this.timeEl.textContent     → formatTime(this.remaining)
  //   this.toggleBtn.textContent  → "Start" if paused, "Pause" if running
  //                                 (hint: what is this.intervalId when paused?)
  //   this.sessionsEl.textContent → e.g. "Sessions: 3"
  //
  // Bonus: add the class "pomo--break" to this.el during breaks so it turns
  // green (already styled). Look up `classList.toggle(name, condition)`.
  render() {
   
    this.modeEl.textContent = this.mode;
    this.timeEl.textContent = formatTime(this.remaining);
    this.toggleBtn.textContent = this.intervalId === null? "Start":"Pause";
    this.sessionsEl.textContent = "Sessions: "+String(this.sessions);
  },

  // TODO 3: toggle()
  // If paused (no intervalId): start a setInterval that calls this.tick()
  //   every 1000ms, and save its id in this.intervalId.
  // If running: clearInterval it and set this.intervalId back to null.
  // Either way, call this.render() at the end so the button label updates.
  //
  // Gotcha: use an arrow function — setInterval(() => this.tick(), 1000).
  // setInterval(this.tick, 1000) loses `this`. (Try it once to see it break!)
  toggle() {
   if (this.intervalId === null){
    this.intervalId = setInterval(()=> this.tick(),1000);
   } 
   else{this.intervalId = clearInterval(this.intervalId);
    this.intervalId = null;
   }
   this.render();
  },

  // TODO 4: tick()
  // Runs once a second while the timer is going.
  //   - Subtract 1 from this.remaining.
  //   - If it hits 0, call this.switchMode().
  //   - Call this.render().
  tick() {
    if(this.remaining !== 0){this.remaining -= 1;}
    else{this.switchMode();}
    this.render()
  },

  // TODO 5: switchMode()
  //   - If you just finished a focus session, add 1 to this.sessions.
  //   - Flip this.mode: "focus" → "break", "break" → "focus".
  //   - Set this.remaining to the new mode's duration (see this.durations).
  //   - Keep the timer running — the break should start on its own.
  //
  // Stretch goals once it works:
  //   - Every 4th break is a long one (15 min). Hint: the % operator.
  //   - Play a sound when the mode switches: new Audio("chime.mp3").play()
  switchMode() {
    if(this.mode === "focus"){this.sessions += 1;}

    this.mode = this.mode =="focus"? "break":"focus";
    this.remaining = this.durations[this.mode];
  },
};

// TODO 1: formatTime(seconds)
// Turn a number of seconds into "MM:SS".
//   formatTime(1500) → "25:00"
//   formatTime(65)   → "01:05"
//   formatTime(9)    → "00:09"
// You need: Math.floor, the % operator, and String(n).padStart(2, "0").
function formatTime(seconds) {
  // TODO: implement
  const min = Math.floor(seconds/60);
  const sec = seconds%60;
  const time = String(min).padStart(2,"0") + ":" + String(sec).padStart(2,"0");

  return time;

}
