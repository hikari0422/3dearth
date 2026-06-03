import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Canvas/3D Earth scene:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-[#020617] text-slate-100 p-6 select-none">
          <div className="relative p-8 bg-purple-950/20 border border-purple-900/50 rounded-2xl max-w-md text-center flex flex-col gap-4 shadow-2xl">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-15 animate-pulse" />
            <div className="relative flex justify-center text-purple-400">
              <svg className="w-10 h-10 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-purple-200 relative">3D Earth Load Interrupted</h2>
            <p className="text-xs text-purple-300/80 leading-relaxed relative">
              The 3D graphics context encountered an issue. The application UI remains fully functional.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="relative mt-2 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-800/80 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 hover:border-purple-500/50"
            >
              Reinitialize Earth Scene
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
