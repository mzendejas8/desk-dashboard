# Desk Dashboard — Notes

Started 2026-10-06. Fun/simple public GitHub project, one widget per session.

## Ground rules
- Skeleton method: finished structure + one finished example (clock), concept
  functions left as TODOs with spec comments. ~1 new concept per TODO.
- `config.js` is gitignored (has real location). Commit `config.example.js` only.
- No secrets in the frontend, ever. Spotify/Calendar need tokens → those widgets
  will need a tiny backend (Flask) when we get there. That's the next new concept.

- No homelab widgets — decided 2026-10-06, keep it out of this project.

## Roadmap (updated 2026-10-12)
**v1.0 — finish line**
1. Pomodoro (TODOs 1–5 in `widgets/pomodoro.js`) ✅ done 2026-10-07
2. ~~Notes widget~~ skipped 2026-10-12, moved to v1.1+
3. Weather (TODOs 1–4 in `widgets/weather.js`) ✅ done 2026-10-08
   - [x] Show the city name on the card (`city` in config.js) ✅ 2026-10-12
4. Coffee walker (added 2026-10-10). 8-bit you walks desk →
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
   - [x] TODOs 6–8: pixel wall clock (7-segment digits, blinking colon) ✅ 2026-10-12
         (TODO 8 + AM/PM + 2× scale filled in for you)
   - Later: trigger the coffee run when pomodoro hits a break
5. ← **you are here** Push to GitHub + live demo (GitHub Pages) + screenshot in README → tag v1.0

**v1.1+ — don't touch until v1.0 is tagged**
- Weather: set city name in config, look up coordinates via Open-Meteo geocoding API (chains two API calls)
- Notes widget (spec from v1.0, skipped 2026-10-12): text box + Add, list, ✕ deletes, localStorage
- Walker: weather in the window (rain/sun/clouds from Open-Meteo code) + pixel wall calendar for the date → then retire the weather card
- Calendar widget: read-only today's events/meetings, in the weather card's old spot. Decide first: Google (OAuth in browser) or work Outlook (Microsoft Graph → via the Flask backend with Asana/Spotify). Start with fake meetings like Tasks
- Note → calendar event button
- Notes v2: click to edit, Enter to add, colors, pin
- Pomodoro stretch: long break every 4th, chime, browser notification
- Spotify now playing (needs backend)
- Tasks widget (right of weather/pomodoro): placeholder card + TODOs 1–2 in `widgets/tasks.js` added 2026-10-12. Real tasks from Asana later (needs backend)
- Keyboard shortcuts, themes, kiosk mode on a monitor
