# Desk Dashboard — Notes

Started 2026-10-06. Fun/simple public GitHub project, one widget per session.

## Ground rules
- Skeleton method: finished structure + one finished example (clock), concept
  functions left as TODOs with spec comments. ~1 new concept per TODO.
- `config.js` is gitignored (has real location). Commit `config.example.js` only.
- No secrets in the frontend, ever. Spotify/Calendar need tokens → those widgets
  will need a tiny backend (Flask) when we get there. That's the next new concept.

- No homelab widgets — decided 2026-10-06, keep it out of this project.

## Roadmap (updated 2026-10-06)
**v1.0 — finish line**
1. Pomodoro (TODOs 1–5 in `widgets/pomodoro.js`) ✅ done 2026-10-07
2. Notes widget — designed + written by you, no skeleton ← **you are here**. Spec:
   - [ ] text box + Add button
   - [ ] notes listed on the card
   - [ ] ✕ deletes a note
   - [ ] survives refresh (localStorage)
3. Weather (TODOs 1–4 in `widgets/weather.js`) ✅ done 2026-10-08
   - [ ] Show the city name on the card (quick: `city` label in config.js)
4. Push to GitHub + live demo (GitHub Pages) + screenshot in README → tag v1.0

**v1.1+ — don't touch until v1.0 is tagged**
- Weather: set city name in config, look up coordinates via Open-Meteo geocoding API (chains two API calls)
- Calendar widget: read-only today's events (Google OAuth in browser)
- Note → calendar event button
- Notes v2: click to edit, Enter to add, colors, pin
- Pomodoro stretch: long break every 4th, chime, browser notification
- Spotify now playing (needs backend)
- Keyboard shortcuts, themes, kiosk mode on a monitor
