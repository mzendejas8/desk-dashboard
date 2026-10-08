# Desk Dashboard

An always-on dashboard for a spare monitor: clock, weather, pomodoro timer, and
(soon) what's playing and today's calendar. Plain HTML/CSS/JS, no build step.

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
| Clock | ✅ | Browser |
| Weather | ✅ | [Open-Meteo](https://open-meteo.com/) (no key) |
| Pomodoro | ✅ | Browser |
| Now playing | Planned | Spotify |
| Calendar | Planned | Google Calendar |
