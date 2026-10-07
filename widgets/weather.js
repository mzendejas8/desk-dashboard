// Weather widget — uses Open-Meteo (free, no API key): https://open-meteo.com/en/docs
//
// Your TODOs, easiest → hardest. Do them in order; each one is one new idea.
//   1. describeWeatherCode()  — object lookup with a fallback
//   2. buildWeatherUrl()      — building a URL with query params
//   3. fetchWeather()         — async/await + fetch + error handling
//   4. render()               — putting data into the DOM
//
// start() and refresh() are finished — they call your functions.
// Tip: open DevTools (F12) → Console to see errors and console.log output.

window.Widgets = window.Widgets || {};

// Open-Meteo returns a number ("WMO weather code") instead of a description.
// Full list: https://open-meteo.com/en/docs (scroll to "WMO Weather interpretation codes")
const WEATHER_CODES = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ hail",
  99: "Thunderstorm w/ hail",
};

Widgets.weather = {
  start(el) {
    this.el = el;
    this.refresh();
    setInterval(() => this.refresh(), CONFIG.weatherRefreshMinutes * 60 * 1000);
  },

  async refresh() {
    try {
      const url = buildWeatherUrl(CONFIG);
      const data = await fetchWeather(url);
      this.render(data);
    } catch (err) {
      console.error("[weather]", err);
      this.el.innerHTML = `<p class="error">Weather unavailable</p>`;
    }
  },

  // TODO 4: render(data)
  // `data` is the parsed JSON from Open-Meteo. The parts you need:
  //   data.current.temperature_2m        → e.g. 72.4
  //   data.current.weather_code          → e.g. 2
  //   data.daily.temperature_2m_max[0]   → today's high
  //   data.daily.temperature_2m_min[0]   → today's low
  //
  // Set this.el.innerHTML to something like:
  //   <div class="weather__temp">72°</div>
  //   <div class="weather__desc">Partly cloudy</div>
  //   <div class="weather__range">H 78° · L 61°</div>
  // (Those class names are already styled in style.css.)
  //
  // Round the temps — Math.round(). Use describeWeatherCode() for the text.
  // Stuck on the shape of `data`? console.log(data) and look in DevTools.
  render(data) {
    // TODO: implement
  },
};

// TODO 1: describeWeatherCode(code)
// Return the matching text from WEATHER_CODES.
// If the code isn't in the table, return "Unknown" instead of undefined.
//   describeWeatherCode(3)   → "Overcast"
//   describeWeatherCode(999) → "Unknown"
function describeWeatherCode(code) {
  // TODO: implement
}

// TODO 2: buildWeatherUrl(config)
// Return a URL string for: https://api.open-meteo.com/v1/forecast
// with these query params:
//   latitude          → config.latitude
//   longitude         → config.longitude
//   current           → "temperature_2m,weather_code"
//   daily             → "temperature_2m_max,temperature_2m_min"
//   temperature_unit  → config.units
//   timezone          → "auto"
//   forecast_days     → 1
//
// You *could* glue strings together, but look up `URLSearchParams` — it
// handles the ?, &, and encoding for you.
// Check yourself: paste the URL it returns into your browser. You should see JSON.
function buildWeatherUrl(config) {
  // TODO: implement
}

// TODO 3: async fetchWeather(url)
// Fetch the URL, and return the parsed JSON.
// One catch: fetch() does NOT throw on a 404/500 — it only throws if the
// network is down. Check `response.ok`, and if it's false, throw an Error
// yourself (include response.status in the message). refresh() catches it
// and shows "Weather unavailable".
async function fetchWeather(url) {
  // TODO: implement
}
