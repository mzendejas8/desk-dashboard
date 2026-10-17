// Weather widget: Open-Meteo (free, no API key), https://open-meteo.com/en/docs

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

  render(data) {
    const temp = Math.round(data.current.temperature_2m);
    const desc = describeWeatherCode(data.current.weather_code);
    const high = Math.round(data.daily.temperature_2m_max[0]);
    const low = Math.round(data.daily.temperature_2m_min[0]);
    this.el.innerHTML = `
      <div class="weather__city">${CONFIG.city}</div>
      <div class="weather__temp">${temp}°</div>
      <div class="weather__desc">${desc}</div>
      <div class="weather__range">H ${high}° · L ${low}°</div>
    `;
  },
};

function describeWeatherCode(code) {
  return WEATHER_CODES[code] ?? "Unknown";
}

function buildWeatherUrl(config) {
  const params = new URLSearchParams({
    latitude: config.latitude,
    longitude: config.longitude,
    current: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min",
    temperature_unit: config.units,
    timezone: "auto",
    forecast_days: 1,
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

// fetch() only throws when the network is down, so a 404/500 has to be
// turned into an error by hand. refresh() catches it.
async function fetchWeather(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
  return response.json();
}
