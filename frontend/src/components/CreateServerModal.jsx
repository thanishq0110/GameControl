import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function CreateServerModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    server_name: '',
    server_password: '',
    max_players: 32,
    description: 'Palworld Server',
    exp_rate: 1.0,
    pal_capture_rate: 1.0,
    pal_spawn_num_rate: 1.0,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.server_name.trim()) {
      setError('Server name is required')
      return
    }
    
    if (!formData.server_password.trim()) {
      setError('Server password is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Create New Server</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 rounded p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Server Name
            </label>
            <input
              type="text"
              name="server_name"
              value={formData.server_name}
              onChange={handleChange}
              placeholder="My Palworld Server"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Server Password
            </label>
            <input
              type="password"
              name="server_password"
              value={formData.server_password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Max Players
            </label>
            <input
              type="number"
              name="max_players"
              value={formData.max_players}
              onChange={handleChange}
              min="1"
              max="32"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Gameplay Settings</h3>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                EXP Rate: {formData.exp_rate}x
              </label>
              <input
                type="range"
                name="exp_rate"
                min="0.5"
                max="5"
                step="0.5"
                value={formData.exp_rate}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm text-slate-400 mb-1">
                Pal Capture Rate: {formData.pal_capture_rate}x
              </label>
              <input
                type="range"
                name="pal_capture_rate"
                min="0.5"
                max="5"
                step="0.5"
                value={formData.pal_capture_rate}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm text-slate-400 mb-1">
                Pal Spawn Rate: {formData.pal_spawn_num_rate}x
              </label>
              <input
                type="range"
                name="pal_spawn_num_rate"
                min="0.5"
                max="5"
                step="0.5"
                value={formData.pal_spawn_num_rate}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}