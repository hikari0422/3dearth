import React from 'react'

export interface EarthSettings {
  showGrid: boolean
  showAtmosphere: boolean
  showBorders: boolean
  autoRotate: boolean
  showTerrain: boolean
  showPillars: boolean
  showTrails: boolean
}

interface SettingsPanelProps {
  isOpen: boolean
  onToggleOpen: () => void
  settings: EarthSettings
  onChangeSettings: (settings: EarthSettings) => void
  lang: 'en' | 'zh'
}

const translations = {
  en: {
    panelTitle: 'Display Settings',
    gridLabel: '🌐 Latitude/Longitude Grid',
    atmosphereLabel: '🌌 Atmospheric Glow',
    bordersLabel: '🗺️ Country Borders',
    rotateLabel: '🔄 Auto Rotation',
    terrainLabel: '🏔️ 3D Terrain Lift',
    pillarsLabel: '📊 Data Energy Pillars',
    trailsLabel: '✈️ Data Particle Flows',
  },
  zh: {
    panelTitle: '地球顯示設定',
    gridLabel: '🌐 顯示經緯線網格',
    atmosphereLabel: '🌌 顯示大氣層光暈',
    bordersLabel: '🗺️ 顯示區塊邊界線',
    rotateLabel: '🔄 啟動自動旋轉',
    terrainLabel: '🏔️ 啟動立體地形隆起',
    pillarsLabel: '📊 顯示數據發光能量柱',
    trailsLabel: '✈️ 顯示數據流粒子飛線',
  }
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onToggleOpen,
  settings,
  onChangeSettings,
  lang
}) => {
  const t = translations[lang]

  const updateSetting = (key: keyof EarthSettings, value: boolean) => {
    onChangeSettings({
      ...settings,
      [key]: value
    })
  }

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 flex items-center select-none">
      {/* 1. Floating Settings Gear Toggle Button */}
      <button
        onClick={onToggleOpen}
        title={t.panelTitle}
        className={`w-12 h-12 rounded-full bg-slate-950/75 border backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-slate-100 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer shadow-xl ${
          isOpen ? 'border-purple-500/80 text-purple-300 bg-purple-950/20' : 'border-slate-900/80'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-5.5 h-5.5 transition-transform duration-700 ${isOpen ? 'rotate-90 text-purple-300' : ''}`}
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* 2. Glassmorphic Settings Switch Card */}
      <div
        className={`absolute left-16 bg-slate-950/80 backdrop-blur-xl border border-slate-900/80 p-4.5 rounded-2xl shadow-2xl flex flex-col gap-3.5 w-60 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-3 pointer-events-none'
        }`}
      >
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {t.panelTitle}
          </h3>
        </div>

        {/* Switch Options List */}
        <div className="space-y-3.5 pt-1">
          {/* A. Latitude & Longitude Grid */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {t.gridLabel}
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={(e) => updateSetting('showGrid', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-slate-100" />
            </div>
          </label>

          {/* B. Atmospheric Glow */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {t.atmosphereLabel}
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={settings.showAtmosphere}
                onChange={(e) => updateSetting('showAtmosphere', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-slate-100" />
            </div>
          </label>

          {/* C. Borders Outline */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {t.bordersLabel}
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={settings.showBorders}
                onChange={(e) => updateSetting('showBorders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-slate-100" />
            </div>
          </label>

          {/* D. Auto Rotation */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {t.rotateLabel}
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={settings.autoRotate}
                onChange={(e) => updateSetting('autoRotate', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-slate-100" />
            </div>
          </label>

          {/* E. 3D Terrain Lift */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {t.terrainLabel}
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={settings.showTerrain}
                onChange={(e) => updateSetting('showTerrain', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-slate-100" />
            </div>
          </label>

          {/* F. Data Energy Pillars */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {t.pillarsLabel}
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={settings.showPillars}
                onChange={(e) => updateSetting('showPillars', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-slate-100" />
            </div>
          </label>

          {/* G. Data Particle Flows */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {t.trailsLabel}
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={settings.showTrails}
                onChange={(e) => updateSetting('showTrails', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-slate-100" />
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
