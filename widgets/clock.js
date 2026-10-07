// FINISHED EXAMPLE WIDGET — read this first, it's the pattern every widget follows:
//   1. start(el) runs once: build the HTML, then kick off updates.
//   2. update() redraws just the parts that change.
//   3. setInterval keeps calling update().

window.Widgets = window.Widgets || {};

Widgets.clock = {
  start(el) {
    el.innerHTML = `
      <div class="clock__time"></div>
      <div class="clock__date"></div>
    `;
    this.timeEl = el.querySelector(".clock__time");
    this.dateEl = el.querySelector(".clock__date");

    this.update();
    setInterval(() => this.update(), 1000);
  },

  update() {
    const now = new Date();
    this.timeEl.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    this.dateEl.textContent = now.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  },
};
