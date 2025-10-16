import React from 'react'
import { X } from 'lucide-react'

export default function ServerDetailsModal({ server, onClose }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Server Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <div>
            <span className="text-sm text-slate-400">Server Name</span>
            <p className="text-slate-100 font-semibold">{server.server_name}</p>
          </div>

          <div>
            <span className="text-sm text-slate-400">Server ID</span>
            <p className="text-slate-100 font-mono text-xs break-all">{server.server_id}</p>
          </div>

          <div>
            <span className="text-sm text-slate-400">Status</span>
            <p className="text-slate-100 font-semibold capitalize">{server.status}</p>
          </div>

          <div>
            <span className="text-sm text-slate-400">Description</span>
            <p className="text-slate-100">{server.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-sm text-slate-400">Game Port (UDP)</span>
              <p className="text-slate-100 font-semibold">{server.port}</p>
            </div>
            
            <div>
              <span className="text-sm text-slate-400">Query Port</span>
              <p className="text-slate-100 font-semibold">{server.port + 10000}</p>
            </div>
            
            <div>
              <span className="text-sm text-slate-400">RCON Port</span>
              <p className="text-slate-100 font-semibold">{server.port + 100}</p>
            </div>
            
            <div>
              <span className="text-sm text-slate-400">Max Players</span>
              <p className="text-slate-100 font-semibold">{server.max_players}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 bg-slate-700 rounded p-4">
            <div>
              <span className="text-sm text-slate-400">CPU Usage</span>
              <p className="text-slate-100 font-semibold">{server.cpu_percent.toFixed(2)}%</p>
            </div>
            
            <div>
              <span className="text-sm text-slate-400">Memory Usage</span>
              <p className="text-slate-100 font-semibold">{Math.round(server.memory_mb)} MB</p>
            </div>
          </div>

          <div>
            <span className="text-sm text-slate-400">Created</span>
            <p className="text-slate-100 text-sm">{formatDate(server.created_at)}</p>
          </div>

          <div>
            <span className="text-sm text-slate-400">Connection String</span>
            <p className="text-slate-100 text-xs font-mono break-all bg-slate-700 p-2 rounded">
              127.0.0.1:{server.port}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}