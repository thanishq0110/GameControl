import React from 'react'
import ServerCard from './ServerCard'
import { Inbox } from 'lucide-react'

export default function Dashboard({
  servers,
  onServerSelect,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewConsole,
  onSettings,
}) {
  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox size={64} className="text-slate-500 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No servers yet</h3>
        <p className="text-slate-400 max-w-md">
          Create your first Palworld game server to get started. Click the "Create Server" button above.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {servers.map((server) => (
        <ServerCard
          key={server.server_id}
          server={server}
          onSelect={onServerSelect}
          onStart={onStart}
          onStop={onStop}
          onRestart={onRestart}
          onDelete={onDelete}
          onViewConsole={onViewConsole}
          onSettings={onSettings}
        />
      ))}
    </div>
  )
}