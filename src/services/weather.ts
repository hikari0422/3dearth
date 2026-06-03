export interface WeatherInfo {
  temp: number
  windSpeed: number
  humidity: number
  weatherCode: number
  type: 'sunny' | 'cloudy' | 'foggy' | 'drizzle' | 'rainy' | 'snowy' | 'stormy'
  descriptionEn: string
  descriptionZh: string
}

interface WeatherMapping {
  type: 'sunny' | 'cloudy' | 'foggy' | 'drizzle' | 'rainy' | 'snowy' | 'stormy'
  en: string
  zh: string
}

function getWeatherCodeMapping(code: number): WeatherMapping {
  if (code === 0) {
    return { type: 'sunny', en: 'Clear sky', zh: '晴朗' }
  }
  if (code === 1 || code === 2 || code === 3) {
    return { type: 'cloudy', en: 'Partly cloudy', zh: '多雲' }
  }
  if (code === 45 || code === 48) {
    return { type: 'foggy', en: 'Foggy', zh: '有霧' }
  }
  if (code === 51 || code === 53 || code === 55) {
    return { type: 'drizzle', en: 'Drizzle', zh: '細雨' }
  }
  if (code === 61 || code === 63 || code === 65) {
    return { type: 'rainy', en: 'Rainy', zh: '雨天' }
  }
  if (code === 71 || code === 73 || code === 75 || code === 77) {
    return { type: 'snowy', en: 'Snowy', zh: '下雪' }
  }
  if (code === 80 || code === 81 || code === 82) {
    return { type: 'rainy', en: 'Showers', zh: '陣雨' }
  }
  if (code === 85 || code === 86) {
    return { type: 'snowy', en: 'Snow showers', zh: '陣雪' }
  }
  if (code === 95 || code === 96 || code === 99) {
    return { type: 'stormy', en: 'Thunderstorm', zh: '雷陣雨' }
  }
  return { type: 'cloudy', en: 'Overcast', zh: '陰天' }
}

/**
 * Fetches current weather info from Open-Meteo for a given latitude and longitude.
 * Requires no API key and runs directly in the client.
 */
export async function fetchWeatherInfo(lat: number, lng: number): Promise<WeatherInfo> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather API error')
  
  const data = await res.json()
  const current = data.current
  const weatherCode = current.weather_code

  const mapping = getWeatherCodeMapping(weatherCode)

  return {
    temp: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    humidity: current.relative_humidity_2m,
    weatherCode,
    type: mapping.type,
    descriptionEn: mapping.en,
    descriptionZh: mapping.zh
  }
}
