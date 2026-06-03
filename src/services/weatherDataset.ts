export interface CityData {
  id: string
  nameEn: string
  nameZh: string
  countryIso: string
  lat: number
  lng: number
  population: number // Simulating population density index
  monthlyTemps: number[] // Monthly average temperature in °C (Jan-Dec)
}

export interface ConnectionData {
  fromCityId: string
  toCityId: string
}

export const citiesDataset: CityData[] = [
  // Taiwan (TWN)
  {
    id: 'twn-taipei',
    nameEn: 'Taipei',
    nameZh: '台北',
    countryIso: 'TWN',
    lat: 25.0330,
    lng: 121.5654,
    population: 2600000,
    monthlyTemps: [16, 17, 19, 22, 26, 28, 30, 29, 27, 24, 21, 18]
  },
  {
    id: 'twn-kaohsiung',
    nameEn: 'Kaohsiung',
    nameZh: '高雄',
    countryIso: 'TWN',
    lat: 22.6273,
    lng: 120.3014,
    population: 2700000,
    monthlyTemps: [19, 20, 23, 26, 28, 29, 29, 29, 28, 27, 24, 21]
  },
  {
    id: 'twn-taichung',
    nameEn: 'Taichung',
    nameZh: '台中',
    countryIso: 'TWN',
    lat: 24.1477,
    lng: 120.6736,
    population: 2800000,
    monthlyTemps: [16, 17, 20, 23, 26, 28, 29, 28, 27, 25, 22, 18]
  },
  {
    id: 'twn-hualien',
    nameEn: 'Hualien',
    nameZh: '花蓮',
    countryIso: 'TWN',
    lat: 23.9872,
    lng: 121.6016,
    population: 320000,
    monthlyTemps: [18, 18, 20, 23, 25, 27, 29, 28, 27, 25, 22, 19]
  },

  // USA (USA)
  {
    id: 'usa-ny',
    nameEn: 'New York',
    nameZh: '紐約',
    countryIso: 'USA',
    lat: 40.7128,
    lng: -74.0060,
    population: 8400000,
    monthlyTemps: [0, 2, 6, 12, 17, 22, 25, 24, 20, 14, 8, 3]
  },
  {
    id: 'usa-la',
    nameEn: 'Los Angeles',
    nameZh: '洛杉磯',
    countryIso: 'USA',
    lat: 34.0522,
    lng: -118.2437,
    population: 3900000,
    monthlyTemps: [13, 14, 15, 17, 18, 20, 22, 23, 22, 20, 16, 13]
  },
  {
    id: 'usa-chicago',
    nameEn: 'Chicago',
    nameZh: '芝加哥',
    countryIso: 'USA',
    lat: 41.8781,
    lng: -87.6298,
    population: 2700000,
    monthlyTemps: [-5, -3, 3, 9, 15, 21, 24, 23, 19, 12, 5, -2]
  },
  {
    id: 'usa-sf',
    nameEn: 'San Francisco',
    nameZh: '舊金山',
    countryIso: 'USA',
    lat: 37.7749,
    lng: -122.4194,
    population: 870000,
    monthlyTemps: [10, 11, 12, 13, 14, 15, 15, 16, 17, 16, 13, 10]
  },

  // Japan (JPN)
  {
    id: 'jpn-tokyo',
    nameEn: 'Tokyo',
    nameZh: '東京',
    countryIso: 'JPN',
    lat: 35.6762,
    lng: 139.6503,
    population: 14000000,
    monthlyTemps: [5, 6, 9, 14, 19, 22, 26, 27, 24, 18, 12, 8]
  },
  {
    id: 'jpn-osaka',
    nameEn: 'Osaka',
    nameZh: '大阪',
    countryIso: 'JPN',
    lat: 34.6937,
    lng: 135.5022,
    population: 2700000,
    monthlyTemps: [6, 6, 9, 15, 20, 24, 28, 29, 25, 19, 13, 8]
  },
  {
    id: 'jpn-sapporo',
    nameEn: 'Sapporo',
    nameZh: '札幌',
    countryIso: 'JPN',
    lat: 43.0618,
    lng: 141.3545,
    population: 1900000,
    monthlyTemps: [-4, -3, 1, 7, 12, 17, 21, 22, 18, 12, 5, -1]
  },

  // China (CHN)
  {
    id: 'chn-beijing',
    nameEn: 'Beijing',
    nameZh: '北京',
    countryIso: 'CHN',
    lat: 39.9042,
    lng: 116.4074,
    population: 21000000,
    monthlyTemps: [-3, 0, 7, 15, 21, 26, 27, 26, 21, 14, 5, -1]
  },
  {
    id: 'chn-shanghai',
    nameEn: 'Shanghai',
    nameZh: '上海',
    countryIso: 'CHN',
    lat: 31.2304,
    lng: 121.4737,
    population: 24000000,
    monthlyTemps: [4, 6, 10, 15, 21, 24, 28, 28, 24, 19, 13, 7]
  },
  {
    id: 'chn-chengdu',
    nameEn: 'Chengdu',
    nameZh: '成都',
    countryIso: 'CHN',
    lat: 30.5728,
    lng: 104.0668,
    population: 16000000,
    monthlyTemps: [6, 8, 12, 17, 22, 25, 27, 26, 22, 17, 12, 8]
  },

  // Canada (CAN)
  {
    id: 'can-toronto',
    nameEn: 'Toronto',
    nameZh: '多倫多',
    countryIso: 'CAN',
    lat: 43.6532,
    lng: -79.3832,
    population: 2900000,
    monthlyTemps: [-4, -3, 1, 8, 14, 20, 23, 22, 18, 11, 5, -1]
  },
  {
    id: 'can-vancouver',
    nameEn: 'Vancouver',
    nameZh: '溫哥華',
    countryIso: 'CAN',
    lat: 49.2827,
    lng: -123.1207,
    population: 675000,
    monthlyTemps: [4, 5, 7, 10, 13, 16, 18, 18, 15, 10, 6, 3]
  },

  // Germany (DEU)
  {
    id: 'deu-berlin',
    nameEn: 'Berlin',
    nameZh: '柏林',
    countryIso: 'DEU',
    lat: 52.5200,
    lng: 13.4050,
    population: 3600000,
    monthlyTemps: [1, 2, 5, 10, 15, 18, 20, 20, 16, 10, 5, 2]
  },
  {
    id: 'deu-munich',
    nameEn: 'Munich',
    nameZh: '慕尼黑',
    countryIso: 'DEU',
    lat: 48.1351,
    lng: 11.5820,
    population: 1400000,
    monthlyTemps: [-1, 0, 4, 9, 14, 17, 19, 19, 15, 9, 4, 0]
  },

  // France (FRA)
  {
    id: 'fra-paris',
    nameEn: 'Paris',
    nameZh: '巴黎',
    countryIso: 'FRA',
    lat: 48.8566,
    lng: 2.3522,
    population: 2100000,
    monthlyTemps: [5, 6, 9, 12, 16, 19, 21, 21, 18, 13, 9, 6]
  },

  // United Kingdom (GBR)
  {
    id: 'gbr-london',
    nameEn: 'London',
    nameZh: '倫敦',
    countryIso: 'GBR',
    lat: 51.5074,
    lng: -0.1278,
    population: 9000000,
    monthlyTemps: [5, 5, 8, 10, 13, 16, 19, 19, 16, 12, 8, 5]
  },

  // India (IND)
  {
    id: 'ind-mumbai',
    nameEn: 'Mumbai',
    nameZh: '孟買',
    countryIso: 'IND',
    lat: 19.0760,
    lng: 72.8777,
    population: 12500000,
    monthlyTemps: [24, 25, 27, 29, 30, 29, 27, 27, 27, 28, 27, 25]
  },
  {
    id: 'ind-delhi',
    nameEn: 'New Delhi',
    nameZh: '新德里',
    countryIso: 'IND',
    lat: 28.6139,
    lng: 77.2090,
    population: 16700000,
    monthlyTemps: [14, 17, 23, 29, 33, 34, 31, 30, 29, 26, 20, 15]
  }
]

// Connectivity lines database for visual particle flight paths
export const mockConnections: ConnectionData[] = [
  // Taiwan connections
  { fromCityId: 'twn-taipei', toCityId: 'twn-kaohsiung' },
  { fromCityId: 'twn-taipei', toCityId: 'twn-taichung' },
  { fromCityId: 'twn-taipei', toCityId: 'twn-hualien' },
  
  // US connections
  { fromCityId: 'usa-ny', toCityId: 'usa-la' },
  { fromCityId: 'usa-ny', toCityId: 'usa-chicago' },
  { fromCityId: 'usa-sf', toCityId: 'usa-la' },

  // Japan connections
  { fromCityId: 'jpn-tokyo', toCityId: 'jpn-osaka' },
  { fromCityId: 'jpn-tokyo', toCityId: 'jpn-sapporo' },

  // China connections
  { fromCityId: 'chn-beijing', toCityId: 'chn-shanghai' },
  { fromCityId: 'chn-beijing', toCityId: 'chn-chengdu' },

  // Germany/France/UK inter-connections
  { fromCityId: 'fra-paris', toCityId: 'gbr-london' },
  { fromCityId: 'deu-berlin', toCityId: 'deu-munich' },
  { fromCityId: 'fra-paris', toCityId: 'deu-berlin' },

  // India connections
  { fromCityId: 'ind-delhi', toCityId: 'ind-mumbai' }
]
