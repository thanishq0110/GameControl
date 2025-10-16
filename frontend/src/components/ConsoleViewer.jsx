import React, { useState, useEffect, useRef } from 'react'
import { X, Copy, Download } from 'lucide-react'

export default function ConsoleViewer({ server, onClose, apiBaseUrl }) {
  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const logsEndRef = useRef(null)
  const wsRef = useRef(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = apiBaseUrl.includes('https') ? 'wss' : 'ws'
        const wsUrl = `${protocol}://${apiBaseUrl.replace(/^https?:\/\//, '')}/ws/logs/${server.server_id}`
        
        wsRef.current = new WebSocket(wsUrl)

        wsRef.current.onopen = () => {
          setConnected(true)
          setError(null)
          setLogs([{ type: 'system', message: 'Connected to server logs', timestamp: new Date().toISOString() }])
        }

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            setLogs((prev) => [...prev, data])
          } catch (err) {
            setLogs((prev) => [...prev, { type: 'log', message: event.data }])
          }
        }

        wsRef.current.onerror = (err) => {
          setError('WebSocket error: ' + err)
          setConnected(false)
        }

        wsRef.current.onclose = () => {
          setConnected(false)
        }
      } catch (err) {
        setError('Failed to connect to logs: ' + err.message)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [server.server_id, apiBaseUrl])

  const copyLogs = () => {
    const text = logs.map((log) => log.message).join('\n')
    navigator.clipboard.writeText(text)
  }

  const downloadLogs = () => {
    const text = logs.map((log) => `[${log.timestamp}] ${log.message}`).join('\n')
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', `${server.server_id}-logs.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-11/12 h-5/6 max-w-2xl flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Server Console</h2>
            <p className="text-sm text-slate-400">{server.server_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-sm text-slate-400">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-900 border border-red-700 rounded flex items-center gap-3 text-red-200">
            ⚠️ {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-900 p-6 font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-slate-500">Waiting for logs...</p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`text-slate-300 mb-1 ${
                  log.type === 'system' ? 'text-blue-400' : 'text-slate-300'
                }`}
              >
                {log.message}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700 bg-slate-800">
          <button
            onClick={copyLogs}
            disabled={logs.length === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <Copy size={16} /> Copy
          </button>
          
          <button
            onClick={downloadLogs}
            disabled={logs.length === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} /> Download
          </button>
          
          <button
            onClick={onClose}
            className="btn-secondary ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}