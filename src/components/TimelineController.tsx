import React, { useEffect } from 'react'

interface TimelineControllerProps {
  currentMonth: number
  onChangeMonth: (month: number) => void
  isPlaying: boolean
  onTogglePlay: () => void
  lang: 'en' | 'zh'
}

const monthsZh = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const TimelineController: React.FC<TimelineControllerProps> = ({
  currentMonth,
  onChangeMonth,
  isPlaying,
  onTogglePlay,
  lang
}) => {
  const months = lang === 'zh' ? monthsZh : monthsEn

  // Automated progression interval when isPlaying is active
  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      onChangeMonth((currentMonth + 1) % 12)
    }, 1500) // 1.5 seconds per month frame

    return () => clearInterval(timer)
  }, [isPlaying, currentMonth, onChangeMonth])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-slate-950/75 backdrop-blur-xl border border-slate-900/80 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4.5 z-30 select-none animate-fade-in">
      
      {/* Play/Pause Button */}
      <button
        onClick={onTogglePlay}
        className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-800/60 hover:bg-purple-800/60 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 text-purple-200 transition-all duration-300 flex items-center justify-center cursor-pointer shrink-0"
        title={isPlaying ? 'Pause / 暫停' : 'Play / 播放'}
      >
        {isPlaying ? (
          // Pause Icon SVG
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <rect x="4" y="4" width="4" height="16" rx="1" />
            <rect x="16" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          // Play Icon SVG
          <svg className="w-4 h-4 fill-current translate-x-[1px]" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Progress Track and Months Labels */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Slider input */}
        <input
          type="range"
          min="0"
          max="11"
          step="1"
          value={currentMonth}
          onChange={(e) => onChangeMonth(parseInt(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none bg-slate-900 border border-slate-800 outline-none cursor-pointer accent-purple-500 hover:accent-purple-400 [&::-webkit-slider-runnable-track]:bg-slate-900 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-[0_0_6px_#a855f7]"
        />

        {/* Localized month labels list */}
        <div className="flex justify-between text-[9px] font-bold text-slate-500">
          {months.map((m, idx) => (
            <span
              key={`month-label-${idx}`}
              onClick={() => onChangeMonth(idx)}
              className={`cursor-pointer transition-colors duration-200 hover:text-purple-300 ${
                idx === currentMonth
                  ? 'text-purple-400 font-black scale-105 drop-shadow-[0_0_4px_rgba(168,85,247,0.3)]'
                  : ''
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
