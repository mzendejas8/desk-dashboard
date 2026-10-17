// Tasks widget: a short to-do list. Click a task to check it off.
// Sample tasks for now; they don't persist across reloads.

window.Widgets = window.Widgets || {};

const SAMPLE_TASKS = [
  { name: "Finish the walker clock", done: true },
  { name: "Notes widget", done: false },
  { name: "Push v1.0 to GitHub", done: false },
];

Widgets.tasks = {
  start(el) {
    el.innerHTML = `
      <div class="tasks__title">Tasks</div>
      <ul class="tasks__list"></ul>
    `;
    this.listEl = el.querySelector(".tasks__list");
    this.tasks = SAMPLE_TASKS;
    this.render();
  },

  render() {
    this.listEl.innerHTML = "";

    for (const task of this.tasks) {
      const li = document.createElement("li");
      li.textContent = task.name;
      if (task.done) li.classList.add("tasks__item--done");
      li.addEventListener("click", () => {
        task.done = !task.done;
        this.render();
      });
      this.listEl.append(li);
    }
  },
};
