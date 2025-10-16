import React from 'react'
import { Gamepad2 } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
            <Gamepad2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-50">GameControl</h1>
            <p className="text-sm text-slate-400">Advanced Game Server Management</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
        </div>
      </div>
    </header>
  )
}