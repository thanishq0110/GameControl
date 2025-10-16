import React, { useState } from 'react'
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  Terminal,
  Settings,
  ChevronDown,
} from 'lucide-react'

export default function ServerCard({
  server,
  onSelect,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewConsole,
  onSettings,
}) {
  const [showActions, setShowActions] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'status-running'
      case 'stopped':
        return 'status-stopped'
      case 'installing':
        return 'status-installing'
      default:
        return 'status-error'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return '🟢'
      case 'stopped':
        return '🔴'
      case 'installing':
        return '🟡'
      default:
        return '⚠️'
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="card hover:border-slate-600 transition-colors duration-200 animate-slide-up">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 cursor-pointer" onClick={() => onSelect(server)}>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-slate-100 truncate">
              {server.server_name}
            </h3>
            <span className={`text-xs ${getStatusColor(server.status)}`}>
              {getStatusIcon(server.status)} {server.status.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-400 truncate">{server.description}</p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors duration-150"
          >
            <ChevronDown size={20} className="text-slate-400" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-12 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10 min-w-40 animate-slide-up">
              {server.status === 'stopped' && (
                <button
                  onClick={() => {
                    onStart(server.server_id)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-600 text-slate-100 flex items-center gap-2 first:rounded-t-lg"
                >
                  <Play size={16} /> Start
                </button>
              )}
              
              {server.status === 'running' && (
                <>
                  <button
                    onClick={() => {
                      onStop(server.server_id)
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-600 text-slate-100 flex items-center gap-2 first:rounded-t-lg"
                  >
                    <Square size={16} /> Stop
                  </button>
                  
                  <button
                    onClick={() => {
                      onRestart(server.server_id)
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-600 text-slate-100 flex items-center gap-2"
                  >
                    <RotateCw size={16} /> Restart
                  </button>
                </>
              )}
              
              <button
                onClick={() => {
                  onViewConsole(server)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-600 text-slate-100 flex items-center gap-2"
              >
                <Terminal size={16} /> Console
              </button>
              
              <button
                onClick={() => {
                  onSettings(server)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-600 text-slate-100 flex items-center gap-2"
              >
                <Settings size={16} /> Settings
              </button>
              
              <div className="border-t border-slate-600"></div>
              
              <button
                onClick={() => {
                  onDelete(server.server_id)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-red-900 text-red-300 flex items-center gap-2 last:rounded-b-lg"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Server Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-slate-700 rounded p-3">
          <span className="text-slate-400 block">Port</span>
          <span className="text-slate-100 font-semibold">{server.port}</span>
        </div>
        
        <div className="bg-slate-700 rounded p-3">
          <span className="text-slate-400 block">Players</span>
          <span className="text-slate-100 font-semibold">{server.max_players}</span>
        </div>
        
        <div className="bg-slate-700 rounded p-3">
          <span className="text-slate-400 block">CPU</span>
          <span className="text-slate-100 font-semibold">
            {server.cpu_percent.toFixed(1)}%
          </span>
        </div>
        
        <div className="bg-slate-700 rounded p-3">
          <span className="text-slate-400 block">Memory</span>
          <span className="text-slate-100 font-semibold">
            {Math.round(server.memory_mb)} MB
          </span>
        </div>
      </div>

      {/* Created At */}
      <p className="text-xs text-slate-500">
        Created: {formatDate(server.created_at)}
      </p>
    </div>
  )
}