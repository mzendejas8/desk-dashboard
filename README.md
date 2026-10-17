# Desk Dashboard

An always-on dashboard for a spare monitor: an 8-bit office with a wall clock,
weather, a pomodoro timer, and a task list. Plain HTML/CSS/JS, no build step.

Live demo: https://mzendejas8.github.io/desk-dashboard/

## Run it

```bash
cp config.example.js config.js   # then edit your lat/long
python3 -m http.server 8000
```

Open http://localhost:8000. For a monitor kiosk: `chromium --kiosk http://localhost:8000`.

## How it works

Each card in `index.html` has a `data-widget="name"`. Each file in `widgets/`
registers an object with a `start(el)` method. `app.js` matches the two up and
starts each widget, so one widget crashing doesn't take down the rest.

Adding a widget = one new file in `widgets/`, one `<script>` tag, one card.

## Widgets

| Widget | Status | Data source |
| --- | --- | --- |
| Coffee walker | ✅ | Sprite sheets + pixel-art office (with a 7-segment wall clock) on a `<canvas>` |
| Weather | ✅ | [Open-Meteo](https://open-meteo.com/) (no key) |
| Pomodoro | ✅ | Browser |
| Tasks | ✅ | Sample tasks, click to check off |

## Art pipeline

The walker's art is generated, then cleaned up by the scripts in `tools/`
(`pip install -r tools/requirements.txt`):

- `slice_sprites.py` turns a loose character sheet into the `assets/me.png`
  grid + `me.json`.
- `slice_chibi.py` keys out the dark background on the kid and baby sheets
  and writes `assets/kid.*` and `assets/baby.*`.
- `slice_background.py` cuts the desk and coffee station off a magenta background.
- `slice_office.py` cuts the wall tile and decorations, and writes `bg.json`.
