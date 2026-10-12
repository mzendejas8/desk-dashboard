// Tasks widget: my to-do list, on the right of weather + pomodoro.
// For now it uses fake tasks. Later they'll come from Asana (needs the
// Flask backend, same as Spotify: no API tokens in the frontend).

window.Widgets = window.Widgets || {};

// Fake tasks to build with. Same shape the real ones will have later.
const SAMPLE_TASKS = [
  { name: "Finish the walker clock", done: true },
  { name: "Notes widget", done: false },
  { name: "Push v1.0 to GitHub", done: false },
];

Widgets.tasks = {
  // FINISHED: build the card, then draw the list.
  start(el) {
    el.innerHTML = `
      <div class="tasks__title">Tasks</div>
      <ul class="tasks__list"></ul>
    `;
    this.listEl = el.querySelector(".tasks__list");
    this.tasks = SAMPLE_TASKS;
    this.render();
  },

  // TODO 1: render()
  // Fill this.listEl with one <li> per task in this.tasks.
  //   - Clear the list first: this.listEl.innerHTML = ""
  //   - For each task: document.createElement("li"), set its textContent to
  //     task.name, then this.listEl.append(li)
  //   - Done tasks get the class "tasks__item--done" (li.classList.add(...))
  render() {
    this.listEl.innerHTML = `<li class="muted">TODO 1: show the tasks here</li>`;
  },

  // TODO 2: click a task to toggle done
  //   - In render(), give each li a click listener that flips task.done
  //     and calls this.render() again.
};
