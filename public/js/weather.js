/* weather.js - Open-Meteo weather (no API key needed) */

const WMO_CODES = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm With Hail'
};

const WMO_ICON = {
  0: 'Sunny',
  1: 'Mostly Clear',
  2: 'Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  61: 'Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  80: 'Showers',
  81: 'Showers',
  82: 'Storm',
  95: 'Storm',
  96: 'Storm'
};

async function fetchWeatherByCoords(lat, lon, cityName) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;
    const res = await fetch(url);
    const data = await res.json();
    renderWeather(data, cityName);
  } catch (error) {
    document.getElementById('weather-main').innerHTML =
      '<div class="weather-loading">Could not load weather data.</div>';
  }
}

function renderWeather(data, cityName) {
  const current = data.current;
  const daily = data.daily;
  const code = current.weather_code;
  const icon = WMO_ICON[code] || 'Weather';
  const desc = WMO_CODES[code] || 'Unknown';

  document.getElementById('weather-location').textContent = cityName;
  document.getElementById('weather-icon-big').textContent = icon;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecastHTML = daily.time.slice(1, 4).map((date, i) => {
    const day = days[new Date(date).getDay()];
    const forecastCode = daily.weather_code[i + 1];
    return `<div class="forecast-day">
      <div class="day-name">${day}</div>
      <div class="day-icon">${WMO_ICON[forecastCode] || 'Weather'}</div>
      <div class="day-temp">${Math.round(daily.temperature_2m_max[i + 1])}°</div>
    </div>`;
  }).join('');

  let advice = 'Good conditions for field work today.';
  if (code >= 61 && code <= 82) advice = 'Rain expected. You may skip irrigation today.';
  else if (code >= 95) advice = 'Storm alert. Protect crops and equipment.';
  else if (current.temperature_2m > 38) advice = 'Heat wave conditions. Increase irrigation frequency if needed.';
  else if (current.temperature_2m < 5) advice = 'Cold alert. Protect frost-sensitive crops.';

  document.getElementById('weather-main').innerHTML = `
    <div class="weather-temp">${Math.round(current.temperature_2m)}°C</div>
    <div class="weather-desc">${desc}</div>
    <div class="weather-details">
      <div class="weather-detail">${current.relative_humidity_2m}% humidity</div>
      <div class="weather-detail">${current.wind_speed_10m} km/h wind</div>
    </div>
    <div class="weather-advice">${advice}</div>
    <div class="weather-forecast">${forecastHTML}</div>`;
}

async function searchWeatherCity() {
  const city = document.getElementById('weather-city-input').value.trim();
  if (!city) return;

  document.getElementById('weather-main').innerHTML =
    '<div class="weather-loading">Searching...</div>';
  document.getElementById('weather-icon-big').textContent = '';

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();
    if (geoData.results && geoData.results.length > 0) {
      const result = geoData.results[0];
      fetchWeatherByCoords(
        result.latitude,
        result.longitude,
        result.name + (result.admin1 ? ', ' + result.admin1 : '')
      );
    } else {
      document.getElementById('weather-main').innerHTML =
        '<div class="weather-loading">City not found. Try again.</div>';
    }
  } catch (error) {
    document.getElementById('weather-main').innerHTML =
      '<div class="weather-loading">Search failed.</div>';
  }
}

function initWeather() {
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'Your Location'),
        () => fetchWeatherByCoords(30.9010, 75.8573, 'Ludhiana, Punjab')
      );
    } else {
      fetchWeatherByCoords(30.9010, 75.8573, 'Ludhiana, Punjab');
    }
  } catch (error) {
    fetchWeatherByCoords(30.9010, 75.8573, 'Ludhiana, Punjab');
  }
}
