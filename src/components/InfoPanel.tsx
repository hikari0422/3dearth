import React from 'react'
import type { WikipediaInfo } from '../services/wikipedia'
import type { WeatherInfo } from '../services/weather'

interface InfoPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  info: WikipediaInfo | null
  loading: boolean
  lang: 'en' | 'zh'
  population?: number | null
  gdp?: number | null
  weather?: WeatherInfo | null
  weatherLoading?: boolean
}

const translations = {
  en: {
    detailsTitle: 'Location Details',
    statistics: 'Analytical Statistics',
    population: 'Population',
    gdp: 'Nominal GDP',
    readMore: 'Read Full Wikipedia Article',
    noData: 'No local statistics available for this subdivision.',
    fetching: 'Synthesizing geological information...',
    closeBtn: 'Close Panel',
    noInfo: 'No detailed description available for this location.',
    weatherTitle: 'Current Climate Conditions',
    temp: 'Temp',
    humidity: 'Humidity',
    windSpeed: 'Wind',
    weatherFetching: 'Loading local climate report...',
    weatherError: 'Weather details unavailable for this region.',
  },
  zh: {
    detailsTitle: '詳細資訊',
    statistics: '數據指標統計',
    population: '人口數量',
    gdp: '名義 GDP',
    readMore: '在維基百科上閱讀完整文章',
    noData: '本行政區域無額外統計指標。',
    fetching: '正在合成地理與維基百科資訊...',
    closeBtn: '關閉面板',
    noInfo: '目前沒有此地點的詳細說明。',
    weatherTitle: '即時氣候數據',
    temp: '氣溫',
    humidity: '濕度',
    windSpeed: '風速',
    weatherFetching: '正在讀取當地即時氣象報告...',
    weatherError: '無法獲取此地區的天氣資訊。',
  }
}

const renderWeatherIcon = (type: string) => {
  switch (type) {
    case 'sunny':
      return (
        <svg className="w-9 h-9 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )
    case 'cloudy':
      return (
        <svg className="w-9 h-9 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.29.26A6 6 0 0 0 3 13.5A3.5 3.5 0 0 0 6.5 17h11" fill="currentColor" fillOpacity="0.2" />
        </svg>
      )
    case 'foggy':
      return (
        <svg className="w-9 h-9 text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.35)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M3 10h18M5 14h14M4 18h16" />
        </svg>
      )
    case 'drizzle':
      return (
        <svg className="w-9 h-9 text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.35)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.29.26A6 6 0 0 0 3 13.5A3.5 3.5 0 0 0 6.5 17h11" fill="currentColor" fillOpacity="0.1" />
          <path d="M8 20v2M12 20v2M16 20v2" />
        </svg>
      )
    case 'rainy':
      return (
        <svg className="w-9 h-9 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.35)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.29.26A6 6 0 0 0 3 13.5A3.5 3.5 0 0 0 6.5 17h11" fill="currentColor" fillOpacity="0.2" />
          <path d="M8 19l-1 3M12 19l-1 3M16 19l-1 3" />
        </svg>
      )
    case 'snowy':
      return (
        <svg className="w-9 h-9 text-blue-200 drop-shadow-[0_0_8px_rgba(224,242,254,0.35)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5L7 19M19 17L5 7M2 12h20" fill="none" />
        </svg>
      )
    case 'stormy':
      return (
        <svg className="w-9 h-9 text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.35)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.29.26A6 6 0 0 0 3 13.5A3.5 3.5 0 0 0 6.5 17h11" fill="currentColor" fillOpacity="0.2" />
          <path d="M13 18l-3 4h3l-2 3" />
        </svg>
      )
    default:
      return (
        <svg className="w-9 h-9 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  isOpen,
  onClose,
  title,
  info,
  loading,
  lang,
  population,
  gdp,
  weather,
  weatherLoading
}) => {
  const t = translations[lang]

  // Formatting helper for metrics values
  const formatNumber = (num: number, isCurrency: boolean): string => {
    if (num >= 1e12) {
      return (isCurrency ? '$' : '') + (num / 1e12).toFixed(2) + ' T'
    }
    if (num >= 1e9) {
      return (isCurrency ? '$' : '') + (num / 1e9).toFixed(2) + ' B'
    }
    if (num >= 1e6) {
      return (isCurrency ? '$' : '') + (num / 1e6).toFixed(2) + ' M'
    }
    return (isCurrency ? '$' : '') + num.toLocaleString()
  }

  return (
    <div
      className={`fixed right-0 top-0 h-screen w-80 sm:w-96 z-40 bg-slate-950/80 backdrop-blur-2xl border-l border-slate-900/80 shadow-2xl flex flex-col transition-transform duration-500 ease-out select-none ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Visual neon side border glow */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500 via-indigo-500 to-pink-500 opacity-60" />

      {/* Header section */}
      <div className="p-5 border-b border-slate-900/80 flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            {t.detailsTitle}
          </span>
          <h2 className="text-lg font-black tracking-wide text-slate-100 truncate mt-0.5" title={info?.title || title}>
            {info?.title || title}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label={t.closeBtn}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-900/60 border border-slate-800/60 text-slate-400 hover:text-slate-100 hover:border-purple-500/50 transition-all cursor-pointer shadow-md"
        >
          ✕
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {loading ? (
          // Loader / Skeleton Screen
          <div className="space-y-6 animate-pulse">
            {/* Thumbnail skeleton */}
            <div className="w-full h-44 bg-slate-900/60 border border-slate-800/40 rounded-2xl" />
            
            {/* Description lines skeleton */}
            <div className="space-y-2.5">
              <div className="h-3.5 bg-slate-900/60 rounded w-11/12" />
              <div className="h-3.5 bg-slate-900/60 rounded w-full" />
              <div className="h-3.5 bg-slate-900/60 rounded w-10/12" />
            </div>

            {/* Metrics skeleton */}
            <div className="space-y-3 pt-4 border-t border-slate-900/60">
              <div className="h-3 bg-slate-900/60 rounded w-1/3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-slate-900/40 rounded-xl" />
                <div className="h-16 bg-slate-900/40 rounded-xl" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Thumbnail Image */}
            {info?.thumbnailUrl ? (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-800/80 shadow-lg">
                <img
                  src={info.thumbnailUrl}
                  alt={info.title}
                  className="w-full h-44 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
              </div>
            ) : null}

            {/* 2. Wikipedia Extract Text */}
            <div className="text-slate-300 text-xs leading-relaxed font-normal whitespace-pre-line text-justify pr-1 max-h-56 overflow-y-auto">
              {info?.extract ? (
                info.extract
              ) : (
                <span className="italic text-slate-500">{t.noInfo}</span>
              )}
            </div>

            {/* 3. Statistical Metrics section (GDP / Population) */}
            {(population || gdp) ? (
              <div className="pt-5 border-t border-slate-900/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {t.statistics}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {population ? (
                    <div className="bg-slate-900/30 border border-slate-900/80 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{t.population}</span>
                      <span className="text-xs font-extrabold text-slate-200 tracking-wide">
                        {formatNumber(population, false)}
                      </span>
                    </div>
                  ) : null}
                  {gdp ? (
                    <div className="bg-slate-900/30 border border-slate-900/80 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{t.gdp}</span>
                      <span className="text-xs font-extrabold text-slate-200 tracking-wide">
                        {formatNumber(gdp, true)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="pt-5 border-t border-slate-900/80 text-[10px] text-slate-500 italic">
                {t.noData}
              </div>
            )}

            {/* Straight divider line between statistics and weather */}
            <hr className="border-slate-900/60 my-4" />

            {/* 4. Weather API Information Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                {t.weatherTitle}
              </h3>
              
              {weatherLoading ? (
                // Weather Loading Skeleton
                <div className="flex items-center gap-3 py-2 animate-pulse text-[10px] text-slate-500 font-medium">
                  <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
                  <span>{t.weatherFetching}</span>
                </div>
              ) : weather ? (
                // Weather Loaded Layout
                <div className="bg-slate-900/25 border border-slate-900/85 rounded-xl p-3.5 flex flex-col gap-3.5">
                  {/* Climate Overview: Dynamic SVG & Localized Description */}
                  <div className="flex items-center gap-3.5">
                    <div className="shrink-0">
                      {renderWeatherIcon(weather.type)}
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-slate-200 tracking-wide">
                        {lang === 'zh' ? weather.descriptionZh : weather.descriptionEn}
                      </span>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                        Current Climate
                      </p>
                    </div>
                  </div>

                  {/* Weather Stats Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-900/40">
                    {/* Temperature */}
                    <div className="flex flex-col gap-1 items-center text-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                      </svg>
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">{t.temp}</span>
                      <span className="text-[11px] font-extrabold text-slate-200 tracking-wide">{weather.temp}°C</span>
                    </div>

                    {/* Humidity */}
                    <div className="flex flex-col gap-1 items-center text-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z" />
                      </svg>
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">{t.humidity}</span>
                      <span className="text-[11px] font-extrabold text-slate-200 tracking-wide">{weather.humidity}%</span>
                    </div>

                    {/* Wind Speed */}
                    <div className="flex flex-col gap-1 items-center text-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                      </svg>
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">{t.windSpeed}</span>
                      <span className="text-[11px] font-extrabold text-slate-200 tracking-wide">{weather.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic">
                  {t.weatherError}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer / Wikipedia article URL button */}
      {info?.fullUrl && !loading && (
        <div className="p-5 border-t border-slate-900/80 bg-slate-950/90 flex flex-col">
          <a
            href={info.fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs py-3 px-4 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4.5 h-4.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{t.readMore}</span>
          </a>
        </div>
      )}
    </div>
  )
}
