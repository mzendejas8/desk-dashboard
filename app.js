// Widgets register themselves here: Widgets.clock = { start(el) { ... } }
// Defined with `var` so each widget file can add to it before app.js runs.
var Widgets = window.Widgets || {};

function init() {
  document.querySelectorAll("[data-widget]").forEach((el) => {
    const name = el.dataset.widget;
    const widget = Widgets[name];

    if (!widget) {
      el.innerHTML = `<p class="error">No widget named "${name}"</p>`;
      return;
    }

    // One broken widget shouldn't take down the whole dashboard.
    try {
      widget.start(el);
    } catch (err) {
      console.error(`[${name}]`, err);
      el.innerHTML = `<p class="error">${name} crashed — see console</p>`;
    }
  });
}

init();
