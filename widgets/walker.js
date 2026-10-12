// Coffee walker — 8-bit you walks desk → coffee machine → back, forever.
//
// Built in 5 steps (TODOs 1–5, all done), easiest → hardest:
//   1. frameSource()  — sprite sheet math: which slice of me.png to draw
//   2. advanceFrame() — step to the next frame, loop back to 0 at the end
//   3. move()         — walk toward the target, switch state on arrival
//   4. switchState()  — the state machine: go to the next state in STATES
//   5. drawScene()    — the background: tile the wall, place the desk + coffee
//
// Digital wall clock (added 2026-10-11): TODOs 6–8, at the bottom of the file.
//
// start(), load(), resize(), tick(), draw(), drawSprite() are finished.
// Read tick() first: it calls your functions in order, ~8 times a second.
//
// State lives on `this` (same idea as pomodoro):
//   this.state  key into STATES below, e.g. "toCoffee"
//   this.frame  which frame of the current animation is showing (0, 1, 2…)
//   this.x      where the character is, in canvas pixels (left edge)
//   this.wait   ticks left before a standing state moves on
//
// Sprite sheet: assets/me.png is a grid. Each ROW is one animation, each
// COLUMN is one frame, every cell is the same size. assets/me.json says how
// big a cell is and which row / how many frames each animation has:
//   this.sheet.frameWidth, this.sheet.frameHeight
//   this.sheet.animations.walkRight → { row: 1, frames: 8 }

window.Widgets = window.Widgets || {};

// The state machine as data. Each state says which animation to play and
// which state comes next. Walking states have a `target` ("coffee" or "desk");
// standing states have `wait` (how many ticks to stand there).
const WALKER_STATES = {
  toCoffee: { anim: "walkRight", target: "coffee", next: "atCoffee" },
  atCoffee: { anim: "idle", wait: 16, next: "toDesk" },             // pouring…
  toDesk:   { anim: "drinkWalk", target: "desk", flip: true, next: "atDesk" },
  atDesk:   { anim: "drinkStand", wait: 40, next: "toCoffee" },     // sip sip
};

// Wall decorations, drawn behind everything except the wall itself.
// x = where its CENTER goes, as a fraction of the canvas width (0 = left, 1 = right).
// top = pixels down from the top of the canvas, or floor: true to stand on the floor.
const WALKER_DECOR = [
  { name: "window", x: 0.28, top: 22 },
  { name: "whiteboard", x: 0.55, top: 42 },
  { name: "poster", x: 0.7, top: 50 },
  { name: "plant", x: 0.82, floor: true },
];

const WALKER_SCALE = 0.5; // sheet frames are ~118×183, draw them at half size
const WALKER_SPEED = 4;   // pixels per tick while walking
const WALKER_TICK_MS = 80;  // lower = faster (legs and steps together)

// Digital clock: where it hangs (same units as WALKER_DECOR) and its colors.
const CLOCK_SPOT = { x: 0.43, top: 12 };
const CLOCK_ON = "#39ff6a";   // lit segment
const CLOCK_OFF = "#16301e";  // unlit segment (real LED clocks show these faintly)

// One digit is 8×14 canvas pixels. Each segment is a rectangle inside it:
// [x, y, width, height], measured from the digit's top-left corner.
//
//    aaaa
//   f    b
//   f    b
//    gggg
//   e    c
//   e    c
//    dddd
const CLOCK_SEGMENTS = {
  a: [2, 0, 4, 2],
  b: [6, 2, 2, 4],
  c: [6, 8, 2, 4],
  d: [2, 12, 4, 2],
  e: [0, 8, 2, 4],
  f: [0, 2, 2, 4],
  g: [2, 6, 4, 2],
};

// Which segments light up for each digit. (A space isn't in here: nothing lit.)
const CLOCK_DIGITS = {
  0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg",
  5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg",
};

const CLOCK_DIGIT_W = 8;  // width of one digit
const CLOCK_COLON_W = 2;  // width of the colon
const CLOCK_GAP = 3;      // space after every character
const CLOCK_PAD = 5;      // space between the case edge and the digits
const CLOCK_SCALE = 2;    // draw the whole clock this many times bigger (whole numbers stay crisp)

// Tiny pixel letters for AM/PM, 5 rows tall: "1" = lit pixel.
const CLOCK_LETTERS = {
  A: ["010", "101", "111", "101", "101"],
  P: ["111", "101", "111", "100", "100"],
  M: ["10001", "11011", "10101", "10001", "10001"],
};
const CLOCK_AMPM_W = 3 + 1 + 5;  // "A"/"P" + 1px gap + "M"

Widgets.walker = {
  start(el) {
    el.innerHTML = `<canvas class="walker__canvas"></canvas>`;
    this.canvas = el.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.load()
      .then(() => {
        this.resize();
        window.addEventListener("resize", () => this.resize());

        this.x = this.positions.desk;
        this.state = "toCoffee";
        this.frame = 0;
        this.wait = 0;

        this.draw();
        setInterval(() => this.tick(), WALKER_TICK_MS);
      })
      .catch((err) => {
        console.error("[walker]", err);
        el.innerHTML = `<p class="error">walker: couldn't load its images — see console</p>`;
      });
  },

  // FINISHED: fetch the frame info and the images. All of it has to arrive
  // before anything can be drawn, so start() waits on this.
  async load() {
    const loadImage = async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return img;
    };

    this.sheet = await (await fetch("assets/me.json")).json();
    this.img = await loadImage("assets/me.png");
    this.spriteW = Math.round(this.sheet.frameWidth * WALKER_SCALE);
    this.spriteH = Math.round(this.sheet.frameHeight * WALKER_SCALE);

    // Background pieces. Same scale as the sprite sheet, so they get
    // WALKER_SCALE too. Each one ends up as { img, w, h } in on-screen pixels:
    //   this.bg.tile    the wall + floor strip (repeat it across)
    //   this.bg.desk    desk, monitor, chair
    //   this.bg.coffee  counter + coffee machine
    //   this.bg.window, .whiteboard, .plant, .clock, .poster  (see WALKER_DECOR)
    const bgInfo = await (await fetch("assets/bg.json")).json();
    this.feetY = bgInfo.tile.feetY;
    this.bg = {};
    for (const name of Object.keys(bgInfo)) {   // tile, desk, coffee, + decor
      const file = name === "tile" ? "bg-tile" : name;
      this.bg[name] = {
        img: await loadImage(`assets/${file}.png`),
        w: Math.round(bgInfo[name].width * WALKER_SCALE),
        h: Math.round(bgInfo[name].height * WALKER_SCALE),
      };
    }
  },

  // FINISHED: match the canvas to the card's width, recompute where things go.
  resize() {
    const { tile, desk, coffee } = this.bg;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = tile.h;
    this.ctx.imageSmoothingEnabled = false; // keep pixels crisp (resets on resize)

    // Feet line: partway down the carpet (bg.json says where).
    this.floorY = Math.round(this.feetY * WALKER_SCALE);

    // Where the furniture is drawn (top-left corner, in canvas pixels).
    // Bottoms sit on the floor line; PROP_DROP nudges both further down.
    const PROP_DROP = 4;
    this.props = {
      deskX: 10,
      deskY: this.floorY - desk.h + PROP_DROP,
      coffeeX: this.canvas.width - 10 - coffee.w,
      coffeeY: this.floorY - coffee.h + PROP_DROP,
    };
    // …and where he stands next to it.
    this.positions = {
      desk: this.props.deskX + desk.w + 4,
      coffee: this.props.coffeeX - this.spriteW - 6,
    };
  },

  // FINISHED: one step of the game loop.
  tick() {
    this.advanceFrame();

    const state = WALKER_STATES[this.state];
    if (state.target) {
      this.move();
    } else {
      this.wait -= 1;
      if (this.wait <= 0) this.switchState();
    }

    this.draw();
  },

  // FINISHED: clear, draw the room, draw the character.
  draw() {
    const state = WALKER_STATES[this.state];
    const { sx, sy } = this.frameSource(state.anim, this.frame);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawScene();
    this.drawSprite(sx, sy, this.x, state.flip);
  },

  // TODO 5: drawScene()
  // Draw the background, back to front. Whatever you draw LAST ends up in
  // front, so order matters: wall first, then furniture. (draw() calls this
  // before drawSprite(), which is why you end up in front of everything.)
  //
  // Each piece is this.bg.<name> = { img, w, h }. The pieces aren't sprite
  // sheets, so use the short 5-argument drawImage, no source rectangle:
  //   ctx.drawImage(img, x, y, w, h)   // draw the whole image at (x, y), w×h
  //
  //   1. Wall: one tile is only this.bg.tile.w wide. Repeat it across the
  //      whole canvas: start at x = 0, draw, move x over by one tile width,
  //      keep going while x < this.canvas.width. (y is 0: top of the canvas.)
  //   2. Desk: at (this.props.deskX, this.props.deskY), size desk.w × desk.h.
  //   3. Coffee: same idea, at (this.props.coffeeX, this.props.coffeeY).
  //
  // Tip: const { tile, desk, coffee } = this.bg;  saves a lot of typing.
  drawScene() {
    const ctx = this.ctx;
    const { tile, desk, coffee } = this.bg;

    for (let x = 0; x < this.canvas.width; x += tile.w) {
      ctx.drawImage(tile.img, x, 0, tile.w, tile.h);
    }
    for (const item of WALKER_DECOR) {
      const { img, w, h } = this.bg[item.name];
      const x = Math.round(this.canvas.width * item.x - w / 2);
      const y = item.floor ? this.floorY - h : item.top;
      ctx.drawImage(img, x, y, w, h);
    }
    ctx.drawImage(desk.img, this.props.deskX, this.props.deskY, desk.w, desk.h);
    ctx.drawImage(coffee.img, this.props.coffeeX, this.props.coffeeY, coffee.w, coffee.h);
    this.drawClock();
  },

  // FINISHED: copy one cell of the sheet onto the canvas at x.
  // flip = draw it mirrored (so a right-facing animation walks left).
  drawSprite(sx, sy, x, flip) {
    const ctx = this.ctx;
    const { frameWidth: fw, frameHeight: fh } = this.sheet;
    const y = this.floorY - this.spriteH;

    ctx.save();
    if (flip) {
      // Mirror around the sprite's own center instead of the canvas edge.
      ctx.translate(x + this.spriteW, 0);
      ctx.scale(-1, 1);
      x = 0;
    }
    // drawImage(image, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH)
    ctx.drawImage(this.img, sx, sy, fw, fh, x, y, this.spriteW, this.spriteH);
    ctx.restore();
  },

  // TODO 1: frameSource(animName, frame)
  // Return { sx, sy }: the top-left pixel of that frame's cell in me.png.
  //   - Look up the animation: this.sheet.animations[animName] → { row, frames }
  //   - Columns go across (x), rows go down (y). Each cell is
  //     this.sheet.frameWidth wide and this.sheet.frameHeight tall.
  //
  // Check yourself (cells are 118×183):
  //   frameSource("idle", 0)      → { sx: 0,   sy: 0 }
  //   frameSource("walkRight", 2) → { sx: 236, sy: 183 }
  //   frameSource("drinkWalk", 1) → { sx: 118, sy: 732 }
  frameSource(animName, frame) {
    const {row} = this.sheet.animations[animName];
    return { sx: frame * this.sheet.frameWidth, sy: row * this.sheet.frameHeight };
  },

  // TODO 2: advanceFrame()
  // Add 1 to this.frame. When it goes past the last frame of the current
  // animation, wrap back to 0.
  //   - Current animation name: WALKER_STATES[this.state].anim
  //   - How many frames it has: this.sheet.animations[name].frames
  // You used the operator for this in formatTime().
  advanceFrame() {
    const { frames } = this.sheet.animations[WALKER_STATES[this.state].anim];
    this.frame = (this.frame + 1) % frames;
  },

  // TODO 3: move()
  // Walk one step toward the target, and switch state when you get there.
  //   - Target x: this.positions[WALKER_STATES[this.state].target]
  //   - If the target is to the right, add WALKER_SPEED to this.x;
  //     if it's to the left, subtract it.
  //   - Arrived? Call this.switchState().
  //
  // Gotcha: WALKER_SPEED is 4, so this.x may jump right past the target and
  // never land exactly on it. Check "close enough" (Math.abs is your friend),
  // then snap this.x onto the target so he doesn't drift.
  move() {
    const target = this.positions[WALKER_STATES[this.state].target];
    if (Math.abs(target - this.x) <= WALKER_SPEED) {
      this.x = target;
      this.switchState();
      return;
    }
    this.x += target > this.x ? WALKER_SPEED : -WALKER_SPEED;
  },

  // TODO 4: switchState()
  // Go to the next state:
  //   - this.state becomes WALKER_STATES[this.state].next
  //   - Restart the animation: this.frame = 0
  //   - If the NEW state has a `wait`, copy it into this.wait
  //
  // That's the whole state machine: the table at the top does the thinking.
  // Try it: add a new state (e.g. stand at the desk with "idle" before the
  // sip) by only editing WALKER_STATES.
  switchState() {
    this.state = WALKER_STATES[this.state].next;
    this.frame = 0;
    const next = WALKER_STATES[this.state];
    if (next.wait) this.wait = next.wait;
  },

  // ---- Digital wall clock -------------------------------------------------
  // drawScene() calls drawClock() every tick, so it's always current.

  // FINISHED: draw the clock's case and return its box { x, y, w, h }.
  // The case is sized to fit 4 digits + a colon + AM/PM.
  // It also moves and scales the canvas so (0, 0) is the case's corner and
  // every clock pixel is CLOCK_SCALE screen pixels. drawClock() undoes that.
  drawClockCase() {
    const ctx = this.ctx;
    const w = 4 * (CLOCK_DIGIT_W + CLOCK_GAP) + CLOCK_COLON_W + CLOCK_GAP + CLOCK_AMPM_W + 2 * CLOCK_PAD;
    const h = 14 + 2 * CLOCK_PAD;
    ctx.translate(Math.round(this.canvas.width * CLOCK_SPOT.x - w * CLOCK_SCALE / 2), CLOCK_SPOT.top);
    ctx.scale(CLOCK_SCALE, CLOCK_SCALE);
    const x = 0;
    const y = 0;

    ctx.fillStyle = "#3a3a4a";                 // frame
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = "#0b0b10";                 // screen
    ctx.fillRect(x, y, w, h);
    return { x, y, w, h };
  },

  // FINISHED: the two dots of the colon, lit or dim.
  drawColon(x, y, on) {
    this.ctx.fillStyle = on ? CLOCK_ON : CLOCK_OFF;
    this.ctx.fillRect(x, y + 3, CLOCK_COLON_W, 2);
    this.ctx.fillRect(x, y + 9, CLOCK_COLON_W, 2);
  },

  // TODO 6: clockText()
  // Return the time as a 5-character string, 12-hour style: "10:42" or " 9:05".
  //   - new Date() → .getHours() is 0–23, .getMinutes() is 0–59
  //   - 0–23 → 1–12: hours % 12, but midnight/noon give 0, which should be 12
  //     (one trick: `x || 12` gives 12 when x is 0)
  //   - Pad the hour to 2 with a SPACE, the minutes to 2 with a "0":
  //     String(n).padStart(2, "0")
  //
  // Check yourself: 13:07 → " 1:07", 0:30 → "12:30", 22:45 → "10:45"
  clockText() {
    const now = new Date();
    const hrs = String(now.getHours()%12 || 12).padStart(2," ");
    const mn = String(now.getMinutes()).padStart(2,"0");
    return `${hrs}:${mn}`;
  },

  // "AM" or "PM": hours 0–11 are AM, 12–23 are PM.
  ampmText() {
    return new Date().getHours() < 12 ? "AM" : "PM";
  },

  // Draw one tiny letter from CLOCK_LETTERS, one fillRect per lit pixel.
  drawLetter(letter, x, y) {
    this.ctx.fillStyle = CLOCK_ON;
    CLOCK_LETTERS[letter].forEach((row, ry) => {
      [...row].forEach((bit, rx) => {
        if (bit === "1") this.ctx.fillRect(x + rx, y + ry, 1, 1);
      });
    });
  },

  // TODO 7: drawDigit(ch, x, y)
  // Draw one 7-segment digit with its top-left corner at (x, y).
  //   - Lit segments for ch: CLOCK_DIGITS[ch]. For " " that's undefined, so
  //     fall back to "" (nothing lit).
  //   - Loop over ALL the segments in CLOCK_SEGMENTS (Object.entries gives you
  //     [name, rect] pairs). Lit ones use CLOCK_ON, the rest CLOCK_OFF.
  //   - Canvas: set this.ctx.fillStyle = color, then
  //     this.ctx.fillRect(x + rx, y + ry, rw, rh)  — rect is relative to the digit.
  //   - Is a segment lit? The digit's string includes its letter: "abc".includes("b")
  drawDigit(ch, x, y) {
    const lit = CLOCK_DIGITS[ch] || "";
    for (const [seg, [rx,ry,rw,rh]] of Object.entries(CLOCK_SEGMENTS)){
      this.ctx.fillStyle = lit.includes(seg) ? CLOCK_ON : CLOCK_OFF;
      this.ctx.fillRect(x+rx,y+ry,rw,rh);
    }
  },

  // TODO 8: drawClock()
  // Put it together:
  //   1. const box = this.drawClockCase();
  //   2. Start x at box.x + CLOCK_PAD, y at box.y + CLOCK_PAD.
  //   3. Go through each character of this.clockText():
  //        ":"  → this.drawColon(x, y, on), then move x by CLOCK_COLON_W + CLOCK_GAP
  //        else → this.drawDigit(ch, x, y), then move x by CLOCK_DIGIT_W + CLOCK_GAP
  //   4. Blink: the colon is `on` during even seconds (getSeconds() and %).
  drawClock() {
    this.ctx.save();                 // drawClockCase() moves/scales the canvas...
    const box = this.drawClockCase();
    let x = box.x + CLOCK_PAD;
    const y = box.y + CLOCK_PAD;
    const on = new Date().getSeconds() % 2 === 0;

    for (const ch of this.clockText()){
      if (ch === ":"){
        this.drawColon(x, y, on);
        x += CLOCK_COLON_W + CLOCK_GAP;
      } else {
        this.drawDigit(ch, x, y);
        x += CLOCK_DIGIT_W + CLOCK_GAP;
      }
    }

    // AM/PM, sitting on the digits' bottom edge (digits are 14 tall, letters 5).
    const [first, second] = this.ampmText();
    this.drawLetter(first, x, y + 14 - 5);
    this.drawLetter(second, x + 4, y + 14 - 5);

    this.ctx.restore();              // ...so put it back for everything else
  },
};
