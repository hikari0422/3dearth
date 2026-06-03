import React, { useState, useEffect, useMemo } from 'react'
import { EarthCanvas } from './components/EarthCanvas'
import { useWorldGeoData, useProvinceGeoData } from './hooks/useGeoData'
import { fetchWikipediaInfo, type WikipediaInfo, zhNameMap } from './services/wikipedia'
import { calculateCentroid, latLngToVector3, vector3ToLatLng } from './utils/geoMath'
import { fetchCountryMetrics, type CountryMetricsMap } from './services/dataVisualization'
import { InfoPanel } from './components/InfoPanel'
import { SettingsPanel, type EarthSettings } from './components/SettingsPanel'
import { fetchWeatherInfo, type WeatherInfo } from './services/weather'
import { TimelineController } from './components/TimelineController'

const translations = {
  en: {
    title: '3D VIRTUAL EARTH',
    searchPlaceholder: 'Search country...',
    randomBtn: 'Random',
    rotateOn: 'Rotate ON',
    rotateOff: 'Rotate OFF',
    backBtn: 'Back to Global',
    themesTitle: 'Visualization Themes',
    themesDesc: 'Thematic analytical overlay mapping values logarithmically',
    themeDefault: 'Default',
    themePop: 'Pop.',
    themeGdp: 'GDP',
    low: 'Low',
    high: 'High',
    fetchingMetrics: 'Fetching Global API statistics...',
    loadingSubdivisions: 'Sub-divisions Loading...',
    dragRotate: 'Drag to Rotate',
    scrollZoom: 'Scroll to Zoom',
    clickFocus: 'Click country to focus, explore, and analyze data',
    hovering: 'Hovering',
    focus: 'Focus',
    subregionsLoaded: 'Sub-regions loaded',
    worldView: 'Level-1 World View • Hover & click a country',
    noData: 'No Data',
    notFound: (q: string) => `Country "${q}" not found. Try "Taiwan", "Japan" or "United States"`,
    provinceError: (c: string) => `Note: Province data is not supported for ${c} yet. Showing country details.`
  },
  zh: {
    title: '3D 虛擬地球',
    searchPlaceholder: '搜尋國家...',
    randomBtn: '隨機抽選',
    rotateOn: '自動旋轉 開',
    rotateOff: '自動旋轉 關',
    backBtn: '返回全球',
    themesTitle: '數據可視化主題',
    themesDesc: '使用對數尺度進行數據分級著色',
    themeDefault: '預設',
    themePop: '人口',
    themeGdp: 'GDP',
    low: '低',
    high: '高',
    fetchingMetrics: '正在獲取全球數據統計...',
    loadingSubdivisions: '行政劃分加載中...',
    dragRotate: '拖曳以旋轉',
    scrollZoom: '滾動以縮放',
    clickFocus: '點選國家以聚焦、探索與分析數據',
    hovering: '懸停',
    focus: '聚焦',
    subregionsLoaded: '已加載行政劃分',
    worldView: '全球視野 • 懸停並點選國家',
    noData: '無數據',
    notFound: (q: string) => `找不到國家 "${q}"。請嘗試搜尋 "Taiwan"、"Japan" 或 "United States"`,
    provinceError: (c: string) => `提示：目前暫不支援 ${c} 的行政劃分地圖，已為您顯示國家詳情。`
  }
}

const App: React.FC = () => {
  // 1. Geography Loading States
  const { data: worldData, loading: worldLoading, error: worldError } = useWorldGeoData()
  const [activeCountryIso, setActiveCountryIso] = useState<string | null>(null)
  const [activeCountryName, setActiveCountryName] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'global' | 'province'>('global')
  const [hoveredCountryName, setHoveredCountryName] = useState<string | null>(null)

  // Side Details Panel State
  const [infoPanelOpen, setInfoPanelOpen] = useState<boolean>(false)

  // 2. State-Level Geography Loader
  const { data: provinceData, loading: provinceLoading, error: provinceError } = useProvinceGeoData(activeCountryIso)

  // 3. Camera Position Target
  const [targetPosition, setTargetPosition] = useState<[number, number, number] | null>(null)

  // 4. Wikipedia API popup states
  const [popupPosition, setPopupPosition] = useState<[number, number, number] | null>(null)
  const [popupTitle, setPopupTitle] = useState<string>('')
  const [popupInfo, setPopupInfo] = useState<WikipediaInfo | null>(null)
  const [popupLoading, setPopupLoading] = useState<boolean>(false)

  // 5. Search states
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchFocused, setSearchFocused] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // 6. Demographic & Economic Visualization States
  const [visualizationMode, setVisualizationMode] = useState<'none' | 'population' | 'gdp'>('none')
  const [metricsMap, setMetricsMap] = useState<CountryMetricsMap | null>(null)
  const [metricsLoading, setMetricsLoading] = useState<boolean>(false)

  // Memoized metrics for the selected country (only if showing national level information)
  const activeMetrics = useMemo(() => {
    if (!activeCountryIso || !metricsMap) return undefined
    const isShowingCountry = popupTitle === activeCountryName
    if (!isShowingCountry) return undefined

    return metricsMap[activeCountryIso.toUpperCase()]
  }, [activeCountryIso, metricsMap, popupTitle, activeCountryName])

  // 7. Earth Parameter Settings State
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  const [settings, setSettings] = useState<EarthSettings>({
    showGrid: true,
    showAtmosphere: true,
    showBorders: true,
    autoRotate: true,
    showTerrain: true,
    showPillars: true,
    showTrails: true
  })

  // 8. Flight Cruise Mode State
  const [flightActive, setFlightActive] = useState<boolean>(false)

  // 9. Timeline States
  const [currentMonth, setCurrentMonth] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  // 10. Weather API States
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null)
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false)

  const triggerWeatherFetch = async (position: [number, number, number]) => {
    setWeatherLoading(true)
    setWeatherInfo(null)
    try {
      const [lat, lng] = vector3ToLatLng(position[0], position[1], position[2])
      const weather = await fetchWeatherInfo(lat, lng)
      setWeatherInfo(weather)
    } catch (err) {
      console.error('Failed to query weather API:', err)
    } finally {
      setWeatherLoading(false)
    }
  }

  // 9. UI Language State
  const [lang, setLang] = useState<'en' | 'zh'>('zh')
  const t = translations[lang]

  const getLocalizedCountryName = (name: string | null): string | null => {
    if (!name) return null
    if (lang === 'zh') {
      const mapped = zhNameMap[name]
      if (mapped) return mapped
    }
    return name
  }

  // Synchronize search input with language changes if it contains an active country
  useEffect(() => {
    if (activeCountryName) {
      setSearchQuery(getLocalizedCountryName(activeCountryName) || activeCountryName)
    }
  }, [lang, activeCountryName])

  // Load population and GDP metrics on mount
  useEffect(() => {
    let active = true
    setMetricsLoading(true)
    fetchCountryMetrics()
      .then((map) => {
        if (!active) return
        setMetricsMap(map)
        setMetricsLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (active) setMetricsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Automatically compute dataset min/max values dynamically for logarithmic scaling
  const { minMetricVal, maxMetricVal } = useMemo(() => {
    if (!metricsMap || visualizationMode === 'none') {
      return { minMetricVal: 1, maxMetricVal: 1 }
    }

    const values: number[] = []
    Object.values(metricsMap).forEach((metric) => {
      const val = visualizationMode === 'population' ? metric.population : metric.gdp
      if (val !== null && val > 0) {
        values.push(val)
      }
    })

    if (values.length === 0) return { minMetricVal: 1, maxMetricVal: 1 }

    return {
      minMetricVal: Math.min(...values),
      maxMetricVal: Math.max(...values)
    }
  }, [metricsMap, visualizationMode])

  // Automatic toast dismissal
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Handles clicking a country (Level 1) or province (Level 2)
  const handleCountryClick = (name: string, code: string, position: [number, number, number]) => {
    // Only treat as sub-region/province click if we are already in province view AND the code matches the current active country
    const isProvinceClick = viewMode === 'province' && code === activeCountryIso

    if (!isProvinceClick) {
      // LEVEL 1: Zoom camera and focus on the new country (from global view or another country's backdrop)
      setActiveCountryIso(code)
      setActiveCountryName(name)
      setTargetPosition(position)
      setViewMode('province')

      // Trigger Wikipedia fetch for country
      triggerWikiFetch(name, position)
    } else {
      // LEVEL 2: Clicked on a state/province within the active country. Maintain focus, update info popup
      triggerWikiFetch(name, position)
    }

    // Trigger Weather fetch based on coordinates
    triggerWeatherFetch(position)

    // Open the Side Info Panel
    setInfoPanelOpen(true)
  }

  // Common Wikipedia fetch trigger
  const triggerWikiFetch = async (placeName: string, position: [number, number, number]) => {
    setPopupPosition(position)
    setPopupTitle(placeName)
    setPopupLoading(true)
    setPopupInfo(null)

    const info = await fetchWikipediaInfo(placeName, lang)
    setPopupInfo(info)
    setPopupLoading(false)
  }

  // Re-fetch Wikipedia info dynamically when language toggles
  useEffect(() => {
    if (popupTitle && popupPosition) {
      triggerWikiFetch(popupTitle, popupPosition)
    }
  }, [lang])

  // Reset the globe view completely
  const handleResetView = () => {
    setViewMode('global')
    setActiveCountryIso(null)
    setActiveCountryName(null)
    setTargetPosition(null)
    setPopupPosition(null)
    setPopupInfo(null)
    setSearchQuery('')
    setInfoPanelOpen(false)
    setWeatherInfo(null)
  }

  // Handles picking a random country and focusing on it
  const handleRandomCountry = () => {
    if (!worldData || worldData.features.length === 0) return

    const validFeatures = worldData.features.filter(
      (f) => f.properties && f.properties.name
    )
    if (validFeatures.length === 0) return

    const randomIndex = Math.floor(Math.random() * validFeatures.length)
    const randomCountry = validFeatures[randomIndex]

    const name = randomCountry.properties.name
    const code = randomCountry.properties.iso_a3 || String(randomCountry.id || 'N/A')

    // Dynamically calculate centroid of found country
    const { type, coordinates } = randomCountry.geometry
    const [lat, lng] = calculateCentroid(coordinates, type)
    const v3 = latLngToVector3(lat, lng, 1.002)

    handleCountryClick(name, code, [v3.x, v3.y, v3.z])
    setSearchQuery(getLocalizedCountryName(name) || name)
  }

  // Handle Search Submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !worldData) return

    const query = searchQuery.trim().toLowerCase()
    // Find matching country by English name or Chinese name
    const found = worldData.features.find((f) => {
      const engName = (f.properties.name || '').toLowerCase()
      const zhName = (zhNameMap[f.properties.name || ''] || '').toLowerCase()
      return engName.includes(query) || zhName.includes(query)
    })

    if (found) {
      // Dynamically calculate centroid of found country
      const { type, coordinates } = found.geometry
      const [lat, lng] = calculateCentroid(coordinates, type)
      const v3 = latLngToVector3(lat, lng, 1.002)

      const name = found.properties.name
      const code = found.properties.iso_a3 || String(found.id || 'N/A')

      handleCountryClick(name, code, [v3.x, v3.y, v3.z])
      setSearchQuery(getLocalizedCountryName(name) || name)
    } else {
      setToastMessage(t.notFound(searchQuery))
    }
  }

  // Show Toast if a country does not support province maps
  useEffect(() => {
    if (provinceError && activeCountryName) {
      const localizedName = getLocalizedCountryName(activeCountryName) || activeCountryName
      setToastMessage(t.provinceError(localizedName))
    }
  }, [provinceError, activeCountryName, lang])

  // Numerical formatting helper for the analytical HUD Legend
  const formatLegendVal = (num: number): string => {
    const isCurrency = visualizationMode === 'gdp'
    if (num >= 1e12) {
      return (isCurrency ? '$' : '') + (num / 1e12).toFixed(1) + 'T'
    }
    if (num >= 1e9) {
      return (isCurrency ? '$' : '') + (num / 1e9).toFixed(1) + 'B'
    }
    if (num >= 1e6) {
      return (isCurrency ? '$' : '') + (num / 1e6).toFixed(1) + 'M'
    }
    if (num >= 1e3) {
      return (isCurrency ? '$' : '') + (num / 1e3).toFixed(0) + 'k'
    }
    return (isCurrency ? '$' : '') + num.toString()
  }

  // Initial Fullscreen Loading
  if (worldLoading) {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center bg-[#020617] text-slate-100 font-sans">
        <div className="relative p-10 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl flex flex-col justify-center items-center gap-6 max-w-sm text-center">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-25 animate-pulse" />
          <div className="relative">
            {/* Elegant Spinning Loader */}
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-widest bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
              3D VIRTUAL EARTH
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Synthesizing geological coordinate mapping systems & rendering core vertices...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error boundary state
  if (worldError) {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center bg-[#020617] text-slate-100 p-6">
        <div className="p-8 bg-red-950/20 border border-red-900/50 rounded-2xl max-w-md text-center flex flex-col gap-4 shadow-2xl">
          <div className="flex justify-center text-red-500">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-red-200">Failed to Load World Data</h2>
          <p className="text-xs text-red-300/80 leading-relaxed">
            {worldError.message || 'An error occurred while loading geographic boundaries.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-900/50 hover:bg-red-800/60 border border-red-800/80 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#020617] text-slate-100 font-sans relative">
      {/* 1. HUD Floating Header Overlay */}
      <header className="absolute top-6 left-6 right-6 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-none">
        
        {/* Title branding */}
        <div className="pointer-events-auto bg-slate-950/60 backdrop-blur-md border border-slate-900/80 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-4.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide">
              {hoveredCountryName ? (
                <span className="text-purple-300 font-semibold animate-pulse">
                  {t.hovering}: {getLocalizedCountryName(hoveredCountryName)}
                  {metricsMap && metricsMap[hoveredCountryName.toUpperCase()] && (
                    <span>
                      {visualizationMode === 'population' && ` • ${t.themePop}: ${formatLegendVal(metricsMap[hoveredCountryName.toUpperCase()].population || 0)}`}
                      {visualizationMode === 'gdp' && ` • ${t.themeGdp}: ${formatLegendVal(metricsMap[hoveredCountryName.toUpperCase()].gdp || 0)}`}
                    </span>
                  )}
                </span>
              ) : activeCountryName ? (
                <span>{t.focus}: {getLocalizedCountryName(activeCountryName)} • {t.subregionsLoaded}</span>
              ) : (
                <span>{t.worldView}</span>
              )}
            </p>
          </div>
        </div>

        {/* Global Controls & Search Box */}
        <div className="flex items-center gap-3 w-full md:w-auto pointer-events-auto">
          {/* Glassmorphism Search bar */}
          <form onSubmit={handleSearch} className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className={`w-full md:w-56 bg-slate-950/60 hover:bg-slate-950/80 text-xs px-4 py-3 rounded-xl border transition-all duration-300 outline-none backdrop-blur-md shadow-xl ${
                searchFocused ? 'border-purple-500/80 w-full md:w-64 shadow-purple-500/5' : 'border-slate-900'
              }`}
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-purple-300 transition-colors cursor-pointer group flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Random Country Selector Button */}
          <button
            type="button"
            onClick={handleRandomCountry}
            title="Focus on a random country!"
            className="bg-slate-950/60 hover:bg-slate-950/90 border border-slate-900 px-4 py-3 rounded-xl text-xs font-semibold shadow-xl transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0 hover:border-purple-500/50 hover:text-purple-300"
          >
            <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="7" cy="7" r="1" fill="currentColor" />
              <circle cx="17" cy="17" r="1" fill="currentColor" />
              <circle cx="17" cy="7" r="1" fill="currentColor" />
              <circle cx="7" cy="17" r="1" fill="currentColor" />
            </svg>
            <span>{t.randomBtn}</span>
          </button>

          {/* Auto-Rotation Toggle Button */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, autoRotate: !s.autoRotate }))}
            title="Toggle Earth Auto-Rotation"
            className={`border px-4 py-3 rounded-xl text-xs font-semibold shadow-xl transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0 ${
              settings.autoRotate
                ? 'bg-purple-950/40 border-purple-800/50 text-purple-200 hover:bg-purple-900/50'
                : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:bg-slate-950/90'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{settings.autoRotate ? t.rotateOn : t.rotateOff}</span>
          </button>

          {/* Language Switcher Button */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            title="Switch Language / 切換語言"
            className="bg-slate-950/60 hover:bg-slate-950/90 border border-slate-900 px-4 py-3 rounded-xl text-xs font-bold shadow-xl transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0 hover:border-purple-500/50 hover:text-purple-300"
          >
            <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{lang === 'en' ? '繁中' : 'EN'}</span>
          </button>

          {/* Reset button shown in L2 province mode */}
          {viewMode === 'province' && (
            <button
              onClick={handleResetView}
              className="bg-purple-900/50 hover:bg-purple-800/70 border border-purple-800/60 text-purple-200 px-4.5 py-3 rounded-xl text-xs font-semibold shadow-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 animate-fade-in"
            >
              <svg className="w-3.5 h-3.5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{t.backBtn}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Demographic / Economic Visualization Theme Selector Selector (HUD Panel) */}
      <div className="absolute bottom-24 left-6 z-10 bg-slate-950/75 backdrop-blur-xl border border-slate-900/80 p-4.5 rounded-2xl shadow-2xl flex flex-col gap-3.5 w-64 select-none">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.themesTitle}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{t.themesDesc}</p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setVisualizationMode('none')}
            className={`py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all border flex items-center justify-center gap-1.5 ${
              visualizationMode === 'none'
                ? 'bg-purple-900/40 border-purple-700/60 text-purple-200 shadow-md shadow-purple-500/5'
                : 'bg-slate-900/40 border-slate-900 hover:bg-slate-900/80 text-slate-400'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M3.6 9h16.8M2 12h20M3.6 15h16.8M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{t.themeDefault}</span>
          </button>
          <button
            disabled={metricsLoading}
            onClick={() => setVisualizationMode('population')}
            className={`py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all border flex items-center justify-center gap-1.5 relative ${
              visualizationMode === 'population'
                ? 'bg-purple-900/40 border-purple-700/60 text-purple-200 shadow-md shadow-purple-500/5'
                : 'bg-slate-900/40 border-slate-900 hover:bg-slate-900/80 text-slate-400 disabled:opacity-50'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{t.themePop}</span>
          </button>
          <button
            disabled={metricsLoading}
            onClick={() => setVisualizationMode('gdp')}
            className={`py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all border flex items-center justify-center gap-1.5 relative ${
              visualizationMode === 'gdp'
                ? 'bg-purple-900/40 border-purple-700/60 text-purple-200 shadow-md shadow-purple-500/5'
                : 'bg-slate-900/40 border-slate-900 hover:bg-slate-900/80 text-slate-400 disabled:opacity-50'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>{t.themeGdp}</span>
          </button>
        </div>

        {/* Choropleth Analytical Legend Scale */}
        {visualizationMode !== 'none' && !metricsLoading && (
          <div className="flex flex-col gap-1.5 animate-fade-in pt-1 border-t border-slate-900/80">
            <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400">
              <span className="uppercase">{visualizationMode === 'population' ? t.themePop : t.themeGdp} {t.low}/{t.high}</span>
            </div>
            {/* Color spectrum gradient bar */}
            <div className="h-2 rounded bg-gradient-to-r from-[#1e1b4b] via-[#a855f7] to-[#f97316] border border-slate-900" />
            <div className="flex justify-between text-[9px] font-medium text-slate-500">
              <span>{t.low} ({formatLegendVal(minMetricVal)})</span>
              <span>{t.high} ({formatLegendVal(maxMetricVal)})</span>
            </div>
          </div>
        )}

        {/* Loading metrics loader overlay */}
        {metricsLoading && (
          <div className="flex items-center gap-2 text-[10px] text-slate-400 animate-pulse pt-1 border-t border-slate-900/80">
            <div className="w-2.5 h-2.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>{t.fetchingMetrics}</span>
          </div>
        )}
      </div>

      {/* 3. Sleek Secondary Loading indicator for Province data */}
      {provinceLoading && (
        <div className="absolute top-28 left-6 z-10 pointer-events-none bg-slate-950/60 backdrop-blur-md border border-slate-900/80 px-3.5 py-2 rounded-xl flex items-center gap-3 shadow-xl">
          <div className="w-3.5 h-3.5 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
          <span className="text-[10px] font-semibold text-slate-300 tracking-wide">
            {t.loadingSubdivisions}
          </span>
        </div>
      )}

      {/* 4. Floating Alert/Toast notification */}
      {toastMessage && (
        <div className="absolute bottom-24 right-6 z-20 bg-slate-950/90 border border-purple-900/50 backdrop-blur-xl px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm text-xs text-slate-300 animate-bounce">
          <svg className="w-4 h-4 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 5. R3F Globe Scene */}
      <div className="flex-1 w-full h-full">
        <EarthCanvas
          worldData={worldData}
          provinceData={provinceData}
          activeCountryIso={activeCountryIso}
          viewMode={viewMode}
          onCountryClick={handleCountryClick}
          onHoverCountry={setHoveredCountryName}
          targetPosition={targetPosition}
          flightActive={flightActive}
          onFlightEnd={() => setFlightActive(false)}
          popupPosition={popupPosition}
          popupTitle={getLocalizedCountryName(popupTitle) || popupTitle}
          popupInfo={popupInfo}
          popupLoading={popupLoading}
          onClosePopup={() => {
            setPopupPosition(null)
            setPopupInfo(null)
            setInfoPanelOpen(false)
            setWeatherInfo(null)
          }}
          visualizationMode={visualizationMode}
          metricsMap={metricsMap}
          minMetricVal={minMetricVal}
          maxMetricVal={maxMetricVal}
          showGrid={settings.showGrid}
          showAtmosphere={settings.showAtmosphere}
          showBorders={settings.showBorders}
          showTerrain={settings.showTerrain}
          showPillars={settings.showPillars}
          showTrails={settings.showTrails}
          currentMonth={currentMonth}
          autoRotate={settings.autoRotate}
        />
      </div>

      {/* 6. HUD Footer Instructions */}
      <footer className={`absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all duration-300 ${
        (settings.showPillars || settings.showTrails) ? 'bottom-28' : 'bottom-6'
      }`}>
        <div className="bg-slate-950/60 backdrop-blur-md border border-slate-900/80 px-5 py-3 rounded-full text-xs text-slate-400 shadow-xl tracking-wide flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="7" />
              <line x1="12" y1="6" x2="12" y2="10" />
            </svg>
            {t.dragRotate}
          </span>
          <span className="text-slate-800">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            {t.scrollZoom}
          </span>
          <span className="text-slate-800">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M6.34 17.66l-2.83 2.83M17.66 6.34l-2.83 2.83" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            {t.clickFocus}
          </span>
        </div>
      </footer>

      {/* 7. Side Details Panel */}
      <InfoPanel
        isOpen={infoPanelOpen}
        onClose={() => {
          setInfoPanelOpen(false)
          setPopupPosition(null)
          setPopupInfo(null)
          setWeatherInfo(null)
        }}
        title={popupTitle}
        info={popupInfo}
        loading={popupLoading}
        lang={lang}
        population={activeMetrics?.population}
        gdp={activeMetrics?.gdp}
        weather={weatherInfo}
        weatherLoading={weatherLoading}
      />

      {/* 8. Earth Settings Panel Overlay */}
      <SettingsPanel
        isOpen={settingsOpen}
        onToggleOpen={() => setSettingsOpen(!settingsOpen)}
        settings={settings}
        onChangeSettings={setSettings}
        lang={lang}
      />

      {/* 9. Dynamic Climate & Population Timeline Controller */}
      {(settings.showPillars || settings.showTrails) && (
        <TimelineController
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          lang={lang}
        />
      )}

      {/* 10. Flight mode floating button */}
      <button
        onClick={() => setFlightActive(!flightActive)}
        title={flightActive ? 'Exit Cruise / 退出巡航' : 'Low-altitude Cruise / 低空巡航'}
        className={`fixed left-6 top-1/2 translate-y-8 w-12 h-12 rounded-full border backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-slate-100 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer shadow-xl z-30 ${
          flightActive ? 'border-purple-500/80 text-purple-300 bg-purple-950/20 animate-pulse' : 'border-slate-900/80 bg-slate-950/75'
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
        </svg>
      </button>
    </div>
  )
}

export default App
