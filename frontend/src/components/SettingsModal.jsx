import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function SettingsModal({ server, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    exp_rate: 1.0,
    pal_capture_rate: 1.0,
    pal_spawn_num_rate: 1.0,
    admin_password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await onSubmit(server.server_id, {
        exp_rate: formData.exp_rate || undefined,
        pal_capture_rate: formData.pal_capture_rate || undefined,
        pal_spawn_num_rate: formData.pal_spawn_num_rate || undefined,
        admin_password: formData.admin_password || undefined,
      })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1000)
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
          <h2 className="text-xl font-bold text-slate-100">Server Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {error && (
            <div className="bg-red-900 border border-red-700 rounded p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900 border border-green-700 rounded p-3 text-green-200 text-sm">
              Settings updated successfully!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
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
            <p className="text-xs text-slate-500 mt-1">
              Lower = slower progression, Higher = faster progression
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
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
            <p className="text-xs text-slate-500 mt-1">
              Higher = easier to catch Pals
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
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
            <p className="text-xs text-slate-500 mt-1">
              Higher = more Pals spawn in the world
            </p>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Admin Password (optional)
            </label>
            <input
              type="password"
              name="admin_password"
              value={formData.admin_password}
              onChange={handleChange}
              placeholder="Leave empty to keep current password"
              className="input"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used for server console access
            </p>
          </div>

          <div className="bg-yellow-900 border border-yellow-700 rounded p-3 text-yellow-200 text-sm">
            ⚠️ Changes will apply after server restart
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
              disabled={loading || success}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}