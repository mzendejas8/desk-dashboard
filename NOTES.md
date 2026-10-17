# Desk Dashboard: Notes

A small side project (October 2026) for practicing plain JavaScript, one
widget at a time. It's wrapped up; these are the notes I kept.

## What each widget taught me

- **Pomodoro**: `setInterval`/`clearInterval`, keeping state on an object,
  rendering from state, why `setInterval(this.tick)` loses `this`.
- **Weather**: `fetch` + `async`/`await`, `URLSearchParams`, `fetch` not
  throwing on a 404/500 (check `response.ok`), lookup tables with a `??`
  fallback.
- **Coffee walker**: `<canvas>` and `drawImage`, sprite sheet math, a game
  loop, and a state machine kept as data (`WALKER_STATES`). Adding the kid and
  the baby meant turning one character into "actor" objects that the same
  functions run on.
- **Wall clock**: drawing 7-segment digits from a lookup table, `padStart`,
  12-hour time with `% 12 || 12`, `ctx.save()`/`translate`/`scale`/`restore`.
- **Tasks**: building a list with `createElement`, click handlers that change
  state and re-render.

## Decisions

- `config.js` is gitignored (real location); `config.example.js` is the
  public fallback, so the GitHub Pages demo works without it.
- No secrets in the frontend. Anything that needs a token (Spotify, Asana,
  calendar) would need a small backend, so those stayed out of scope.
- The art is AI-generated, then cleaned up with the Python scripts in `tools/`.

## Ideas, if I ever come back to it

- Start the coffee run when the pomodoro hits a break
- Weather in the walker's window (rain/sun/clouds) instead of a weather card
- Notes widget with `localStorage`
- Pomodoro: long break every 4th session, a chime
- Real tasks from Asana via a Flask endpoint, falling back to the samples
