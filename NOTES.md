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
2. Notes widget — designed + written by you, no skeleton ← paused 2026-10-10 for the walker. Spec:
   - [ ] text box + Add button
   - [ ] notes listed on the card
   - [ ] ✕ deletes a note
   - [ ] survives refresh (localStorage)
3. Weather (TODOs 1–4 in `widgets/weather.js`) ✅ done 2026-10-08
   - [ ] Show the city name on the card (quick: `city` label in config.js)
4. Coffee walker ← **you are here** (added 2026-10-10). 8-bit you walks desk →
   coffee machine → back, on a `<canvas>`. New concepts: sprite sheets,
   `drawImage` slices, game loop, state machine.
   - [x] Sprite sheet: generated art → `tools/slice_sprites.py` → `assets/me.png`
         + `assets/me.json` (118×183 cells, one animation per row)
   - [x] Widget skeleton (`widgets/walker.js`), hooked into index.html + style.css
   - [x] TODOs 1–4 in `widgets/walker.js` ✅ 2026-10-10 (3 + 4 via reference,
         walked through line by line). Working copy: `walker.reference.js` (gitignored)
   - [x] Background art: Gemini image on magenta → `tools/slice_background.py`
         → `assets/bg-tile.png`, `desk.png`, `coffee.png`, `bg.json`
   - [x] TODO 5 `drawScene()` ✅ (filled in for you)
   - [x] Office look: Gemini wall + decor → `tools/slice_office.py` → bg-tile,
         window, whiteboard, plant, clock, poster. Layout = `WALKER_DECOR` in walker.js
   - Later: trigger the coffee run when pomodoro hits a break
5. Push to GitHub + live demo (GitHub Pages) + screenshot in README → tag v1.0

**v1.1+ — don't touch until v1.0 is tagged**
- Weather: set city name in config, look up coordinates via Open-Meteo geocoding API (chains two API calls)
- Calendar widget: read-only today's events (Google OAuth in browser)
- Note → calendar event button
- Notes v2: click to edit, Enter to add, colors, pin
- Pomodoro stretch: long break every 4th, chime, browser notification
- Spotify now playing (needs backend)
- Keyboard shortcuts, themes, kiosk mode on a monitor
