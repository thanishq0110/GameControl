import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Dashboard from './components/Dashboard'
import CreateServerModal from './components/CreateServerModal'
import ServerDetailsModal from './components/ServerDetailsModal'
import SettingsModal from './components/SettingsModal'
import ConsoleViewer from './components/ConsoleViewer'
import Header from './components/Header'
import { AlertCircle } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedServer, setSelectedServer] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created') // 'created', 'name', 'status'
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'running', 'stopped', 'installing'

  // Fetch servers
  const fetchServers = useCallback(async () => {
    try {
      setError(null)
      const response = await axios.get(`${API_BASE_URL}/api/servers`)
      setServers(response.data)
    } catch (err) {
      console.error('Error fetching servers:', err)
      setError('Failed to load servers. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and polling
  useEffect(() => {
    fetchServers()
    const interval = setInterval(fetchServers, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [fetchServers])

  // Filter and sort servers
  const filteredServers = servers
    .filter(server => {
      const matchesSearch = server.server_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || server.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.server_name.localeCompare(b.server_name)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'created':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

  const handleCreateServer = async (config) => {
    try {
      await axios.post(`${API_BASE_URL}/api/servers`, config)
      setShowCreateModal(false)
      await fetchServers()
    } catch (err) {
      setError('Failed to create server: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleStartServer = async (serverId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/servers/${serverId}/start`)
      await fetchServers()
    } catch (err) {
      setError('Failed to start server: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleStopServer = async (serverId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/servers/${serverId}/stop`)
      await fetchServers()
    } catch (err) {
      setError('Failed to stop server: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleRestartServer = async (serverId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/servers/${serverId}/restart`)
      await fetchServers()
    } catch (err) {
      setError('Failed to restart server: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDeleteServer = async (serverId) => {
    if (window.confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/servers/${serverId}`)
        await fetchServers()
      } catch (err) {
        setError('Failed to delete server: ' + (err.response?.data?.detail || err.message))
      }
    }
  }

  const handleUpdateSettings = async (serverId, settings) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/servers/${serverId}/settings`, settings)
      setShowSettingsModal(false)
      await fetchServers()
    } catch (err) {
      setError('Failed to update settings: ' + (err.response?.data?.detail || err.message))
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-900 border border-red-700 rounded-lg flex items-center gap-3 text-red-200 animate-slide-up">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-300 hover:text-red-100"
          >
            ✕
          </button>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search servers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input flex-1"
            />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input bg-slate-800 border border-slate-700 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="installing">Installing</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input bg-slate-800 border border-slate-700 rounded-lg"
            >
              <option value="created">Newest First</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary whitespace-nowrap"
            >
              + Create Server
            </button>
          </div>

          {/* Dashboard */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <Dashboard
              servers={filteredServers}
              onServerSelect={(server) => {
                setSelectedServer(server)
                setShowDetailsModal(true)
              }}
              onStart={handleStartServer}
              onStop={handleStopServer}
              onRestart={handleRestartServer}
              onDelete={handleDeleteServer}
              onViewConsole={(server) => {
                setSelectedServer(server)
                setShowConsole(true)
              }}
              onSettings={(server) => {
                setSelectedServer(server)
                setShowSettingsModal(true)
              }}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateServer}
        />
      )}

      {showDetailsModal && selectedServer && (
        <ServerDetailsModal
          server={selectedServer}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedServer(null)
          }}
        />
      )}

      {showSettingsModal && selectedServer && (
        <SettingsModal
          server={selectedServer}
          onClose={() => {
            setShowSettingsModal(false)
            setSelectedServer(null)
          }}
          onSubmit={handleUpdateSettings}
        />
      )}

      {showConsole && selectedServer && (
        <ConsoleViewer
          server={selectedServer}
          onClose={() => {
            setShowConsole(false)
            setSelectedServer(null)
          }}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  )
}

export default App