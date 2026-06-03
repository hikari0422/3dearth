export interface CountryMetric {
  population: number | null
  gdp: number | null
  name?: string
}

export type CountryMetricsMap = Record<string, CountryMetric>

/**
 * Fetches demographic data (population) from Rest Countries API and
 * economic data (GDP) from the World Bank API, merging them into a unified ISO-3 keyed map.
 *
 * @returns Promise<CountryMetricsMap>
 */
export async function fetchCountryMetrics(): Promise<CountryMetricsMap> {
  const metricsMap: CountryMetricsMap = {}

  // 1. URLs for Rest Countries (population) and World Bank (GDP for 2023)
  const restCountriesUrl = 'https://restcountries.com/v3.1/all?fields=cca3,population,name'
  const worldBankGdpUrl = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=300&date=2023'

  try {
    const [rcRes, wbRes] = await Promise.all([
      fetch(restCountriesUrl).then((r) => (r.ok ? r.json() : null)),
      fetch(worldBankGdpUrl).then((r) => (r.ok ? r.json() : null))
    ])

    // 2. Process Rest Countries Population Data
    if (rcRes && Array.isArray(rcRes)) {
      rcRes.forEach((item: any) => {
        const iso3 = item.cca3?.toUpperCase()
        if (iso3) {
          metricsMap[iso3] = {
            population: item.population || null,
            gdp: null, // To be filled from World Bank
            name: item.name?.common || ''
          }
        }
      })
    }

    // 3. Process World Bank GDP Data
    // World Bank returns: [ {page: 1, ...}, [ {countryiso3code: "USA", value: 27360000000000}, ... ] ]
    if (wbRes && Array.isArray(wbRes) && wbRes.length > 1 && Array.isArray(wbRes[1])) {
      wbRes[1].forEach((item: any) => {
        const iso3 = item.countryiso3code?.toUpperCase()
        if (iso3) {
          const gdpValue = item.value || null
          if (metricsMap[iso3]) {
            metricsMap[iso3].gdp = gdpValue
          } else {
            metricsMap[iso3] = {
              population: null,
              gdp: gdpValue,
              name: item.country?.value || ''
            }
          }
        }
      })
    }

    return metricsMap
  } catch (error) {
    console.error('Error fetching country metrics data:', error)
    // Return empty map on error, app will gracefully show base styling
    return metricsMap
  }
}
