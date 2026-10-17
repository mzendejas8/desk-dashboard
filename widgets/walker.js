// Coffee walker: a pixel-art office on a <canvas>. I walk desk → coffee
// machine → back, while the kid and the baby run their own loops.
//
// Each character is an "actor" object with its own sprite sheet, state table
// and position. The functions below take the actor as `a`, so the same code
// runs everyone: this.actors = [this.me, this.kid, this.baby].
//   a.state  key into its states table, e.g. "toCoffee"
//   a.frame  which frame of the current animation is showing (0, 1, 2…)
//   a.x      where the character is, in canvas pixels (left edge)
//   a.wait   ticks left before a standing state moves on
//   a.held   ticks the current frame has been showing (see `hold` below)
//
// Sprite sheets (assets/<name>.png) are grids: each ROW is one animation,
// each COLUMN one frame, every cell the same size. assets/<name>.json has the
// cell size and each animation's row + frame count:
//   a.sheet.animations.walkRight → { row: 1, frames: 8 }

window.Widgets = window.Widgets || {};

// The state machines as data. Each state says which animation to play and
// which state comes next. Walking states have a `target` (a key into the
// actor's positions); standing states have `wait` (ticks to stand there).
// `hold` = ticks each frame stays up (default 1); the girls' sheets only have
// 1–2 frames per animation, so without it a wave flickers 12 times a second.
const WALKER_STATES = {
  toCoffee: { anim: "walkRight", target: "coffee", next: "atCoffee" },
  atCoffee: { anim: "idle", wait: 16, next: "toDesk" },             // pouring…
  toDesk:   { anim: "drinkWalk", target: "desk", flip: true, next: "atDesk" },
  atDesk:   { anim: "drinkStand", wait: 40, next: "toCoffee" },     // sip sip
};

// The kid: wander → wave → sit with a drink → cheer → look up at the clock.
const KID_STATES = {
  toMiddle: { anim: "walkRight", target: "middle", hold: 2, next: "waving" },
  waving:   { anim: "wave", wait: 24, hold: 4, next: "toPlant" },
  toPlant:  { anim: "walkRight", target: "plant", hold: 2, next: "sitting" },
  sitting:  { anim: "sit", wait: 24, next: "drinking" },
  drinking: { anim: "drink", wait: 32, next: "toRug" },
  toRug:    { anim: "walkLeft", target: "rug", hold: 2, next: "cheering" },
  cheering: { anim: "cheer", wait: 24, hold: 4, next: "clock" },
  clock:    { anim: "back", wait: 40, next: "toMiddle" },                // what time is it?
};

// The girls' spots: the CENTER of each spot, as a fraction of canvas width.
const KID_SPOTS = { rug: 0.4, middle: 0.55, plant: 0.72 };

// The baby: toddle over → sit → bottle → cheer → toddle back → wave, then
// look out the window.
const BABY_STATES = {
  toToys:   { anim: "walkRight", target: "toys", hold: 3, next: "playing" },
  playing:  { anim: "sit", wait: 40, next: "bottle" },
  bottle:   { anim: "drink", wait: 30, next: "cheering" },
  cheering: { anim: "cheer", wait: 20, hold: 4, next: "toWindow" },
  toWindow: { anim: "walkLeft", target: "window", hold: 3, next: "waving" },
  waving:   { anim: "wave", wait: 24, hold: 5, next: "window" },
  window:   { anim: "back", wait: 60, next: "toToys" },                  // birds?
};
const BABY_SPOTS = { window: 0.28, toys: 0.46 };

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
const KID_SPEED = 2;      // little legs
const KID_DROP = 4;       // her feet sit this much lower = closer to you, so she's drawn in front
const BABY_SPEED = 1;     // tiny legs
const BABY_DROP = 6;      // closest of all: in front of the kid

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

        Object.assign(this.me, { x: this.me.positions.desk, state: "toCoffee", frame: 0, wait: 0, held: 0 });
        Object.assign(this.kid, { x: this.kid.positions.rug, state: "toMiddle", frame: 0, wait: 0, held: 0 });
        Object.assign(this.baby, { x: this.baby.positions.window, state: "toToys", frame: 0, wait: 0, held: 0 });

        this.draw();
        setInterval(() => this.tick(), WALKER_TICK_MS);
      })
      .catch((err) => {
        console.error("[walker]", err);
        el.innerHTML = `<p class="error">walker: couldn't load its images — see console</p>`;
      });
  },

  // Fetch the frame info and the images. All of it has to arrive
  // before anything can be drawn, so start() waits on this.
  async load() {
    const loadImage = async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return img;
    };

    // One actor per character: its sheet + image + how big to draw a frame.
    // kid.png / baby.png are already shrunk by tools/slice_chibi.py, so they're drawn at 1×.
    const loadActor = async (name, scale, extra) => {
      const sheet = await (await fetch(`assets/${name}.json`)).json();
      return {
        sheet,
        img: await loadImage(`assets/${name}.png`),
        spriteW: Math.round(sheet.frameWidth * scale),
        spriteH: Math.round(sheet.frameHeight * scale),
        ...extra,
      };
    };
    this.me = await loadActor("me", WALKER_SCALE, { states: WALKER_STATES, speed: WALKER_SPEED, drop: 0 });
    this.kid = await loadActor("kid", 1, { states: KID_STATES, spots: KID_SPOTS, speed: KID_SPEED, drop: KID_DROP });
    this.baby = await loadActor("baby", 1, { states: BABY_STATES, spots: BABY_SPOTS, speed: BABY_SPEED, drop: BABY_DROP });
    this.actors = [this.me, this.kid, this.baby]; // drawn in this order: back to front

    // Background pieces. Same scale as the sprite sheet, so they get
    // WALKER_SCALE too. Each one ends up as { img, w, h } in on-screen pixels:
    //   this.bg.tile    the wall + floor strip (repeat it across)
    //   this.bg.desk    desk, monitor, chair
    //   this.bg.coffee  counter + coffee machine
    //   this.bg.window, .whiteboard, .plant, .poster  (see WALKER_DECOR)
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

  // Match the canvas to the card's width, recompute where things go.
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
    this.me.positions = {
      desk: this.props.deskX + desk.w + 4,
      coffee: this.props.coffeeX - this.me.spriteW - 6,
    };
    // The girls' spots: fraction of the width → left edge (spots are centers).
    for (const a of [this.kid, this.baby]) {
      a.positions = {};
      for (const [spot, frac] of Object.entries(a.spots)) {
        a.positions[spot] = Math.round(this.canvas.width * frac - a.spriteW / 2);
      }
    }
  },

  // One step of the game loop, for every actor.
  tick() {
    for (const a of this.actors) {
      this.advanceFrame(a);

      const state = a.states[a.state];
      if (state.target) {
        this.move(a);
      } else {
        a.wait -= 1;
        if (a.wait <= 0) this.switchState(a);
      }
    }

    this.draw();
  },

  // Clear, draw the room, draw the characters.
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawScene();

    for (const a of this.actors) {
      const state = a.states[a.state];
      const { sx, sy } = this.frameSource(a, state.anim, a.frame);
      this.drawSprite(a, sx, sy, a.x, state.flip);
    }
  },

  // The room, back to front: wall tiles, decorations, furniture, clock.
  // draw() calls this before the sprites, so the characters end up in front.
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

  // Copy one cell of the sheet onto the canvas at x.
  // flip = draw it mirrored (so a right-facing animation walks left).
  drawSprite(a, sx, sy, x, flip) {
    const ctx = this.ctx;
    const { frameWidth: fw, frameHeight: fh } = a.sheet;
    const y = this.floorY + a.drop - a.spriteH;

    ctx.save();
    if (flip) {
      // Mirror around the sprite's own center instead of the canvas edge.
      ctx.translate(x + a.spriteW, 0);
      ctx.scale(-1, 1);
      x = 0;
    }
    // drawImage(image, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH)
    ctx.drawImage(a.img, sx, sy, fw, fh, x, y, a.spriteW, a.spriteH);
    ctx.restore();
  },

  // Top-left pixel { sx, sy } of an animation frame's cell in the sheet.
  frameSource(a, animName, frame) {
    const { row } = a.sheet.animations[animName];
    return { sx: frame * a.sheet.frameWidth, sy: row * a.sheet.frameHeight };
  },

  // Next frame of the current animation (wrapping to 0), once the current
  // frame has been up for the state's `hold` ticks.
  advanceFrame(a) {
    const state = a.states[a.state];
    a.held += 1;
    if (a.held < (state.hold || 1)) return;
    a.held = 0;

    const { frames } = a.sheet.animations[state.anim];
    a.frame = (a.frame + 1) % frames;
  },

  // One step toward the target. Speed can overshoot it, so "close enough"
  // snaps onto the target and moves on to the next state.
  move(a) {
    const target = a.positions[a.states[a.state].target];
    if (Math.abs(target - a.x) <= a.speed) {
      a.x = target;
      this.switchState(a);
      return;
    }
    a.x += target > a.x ? a.speed : -a.speed;
  },

  // Go to the next state and restart its animation (and its wait, if any).
  switchState(a) {
    a.state = a.states[a.state].next;
    a.frame = 0;
    a.held = 0;
    const next = a.states[a.state];
    if (next.wait) a.wait = next.wait;
  },

  // ---- Digital wall clock -------------------------------------------------
  // drawScene() calls drawClock() every tick, so it's always current.

  // Draw the clock's case and return its box { x, y, w, h }.
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

  // The two dots of the colon, lit or dim.
  drawColon(x, y, on) {
    this.ctx.fillStyle = on ? CLOCK_ON : CLOCK_OFF;
    this.ctx.fillRect(x, y + 3, CLOCK_COLON_W, 2);
    this.ctx.fillRect(x, y + 9, CLOCK_COLON_W, 2);
  },

  // The time as 5 characters, 12-hour style: "10:42" or " 9:05".
  clockText() {
    const now = new Date();
    const hrs = String(now.getHours() % 12 || 12).padStart(2, " ");
    const mn = String(now.getMinutes()).padStart(2, "0");
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

  // One 7-segment digit with its top-left corner at (x, y). A space lights
  // nothing, but the unlit segments still show faintly.
  drawDigit(ch, x, y) {
    const lit = CLOCK_DIGITS[ch] || "";
    for (const [seg, [rx, ry, rw, rh]] of Object.entries(CLOCK_SEGMENTS)) {
      this.ctx.fillStyle = lit.includes(seg) ? CLOCK_ON : CLOCK_OFF;
      this.ctx.fillRect(x + rx, y + ry, rw, rh);
    }
  },

  // Case, digits, blinking colon (on during even seconds), AM/PM.
  drawClock() {
    this.ctx.save();                 // drawClockCase() moves/scales the canvas...
    const box = this.drawClockCase();
    let x = box.x + CLOCK_PAD;
    const y = box.y + CLOCK_PAD;
    const on = new Date().getSeconds() % 2 === 0;

    for (const ch of this.clockText()) {
      if (ch === ":") {
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
