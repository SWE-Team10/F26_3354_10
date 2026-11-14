import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function SafetyBoard({ profile }) {
  const [concerns, setConcerns] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('info')
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const isSafetyOfficer = profile?.role === 'safety_officer'

  // 1. Fetch all safety concerns (runs for every role)
  async function fetchConcerns() {
    const { data, error } = await supabase
      .from('safety_concerns')
      .select('*, author:created_by(full_name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching safety concerns:', error.message)
    } else {
      setConcerns(data)
    }
  }

  useEffect(() => {
    fetchConcerns()
  }, [])

  // 2. Create or Update a safety concern (Safety Officer only)
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    if (editingId) {
      // Update existing concern
      const { error } = await supabase
        .from('safety_concerns')
        .update({ title, message, severity })
        .eq('id', editingId)

      if (error) alert('Update failed: ' + error.message)
      else setEditingId(null)
    } else {
      // Insert new concern
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('safety_concerns').insert([
        {
          title,
          message,
          severity,
          created_by: user.id, // Required by your INSERT RLS policy
        },
      ])

      if (error) alert('Post failed: ' + error.message)
    }

    setTitle('')
    setMessage('')
    setSeverity('info')
    setLoading(false)
    fetchConcerns()
  }

  // 3. Populate form for editing
  function startEditing(item) {
    setEditingId(item.id)
    setTitle(item.title)
    setMessage(item.message)
    setSeverity(item.severity)
  }

  function cancelEditing() {
    setEditingId(null)
    setTitle('')
    setMessage('')
    setSeverity('info')
  }

  // 4. Delete a safety concern (Safety Officer only)
  async function handleDelete(id) {
    const { error } = await supabase
      .from('safety_concerns')
      .delete()
      .eq('id', id)

    if (error) alert('Delete failed: ' + error.message)
    else fetchConcerns()
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Safety Concerns & Announcements</h2>

      {/* Form is ONLY rendered for Safety Officers */}
      {isSafetyOfficer && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h3>{editingId ? 'Edit Safety Concern' : 'Post New Safety Concern'}</h3>

          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="Title (e.g., Wet Floor in Bay 2)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '6px' }}
            />
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <textarea
              placeholder="Describe the safety concern or instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={3}
              style={{ width: '100%', padding: '6px' }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label>Severity: </label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Post Concern'}
          </button>

          {editingId && (
            <button type="button" onClick={cancelEditing} style={{ marginLeft: '0.5rem' }}>
              Cancel
            </button>
          )}
        </form>
      )}

      {/* List visible to ALL logged-in roles */}
      {concerns.length === 0 ? (
        <p>No active safety concerns.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {concerns.map((item) => (
            <li
              key={item.id}
              style={{
                border: '1px solid #ddd',
                padding: '1rem',
                marginBottom: '0.75rem',
                borderLeft: `5px solid ${
                  item.severity === 'critical' ? 'red' : item.severity === 'warning' ? 'orange' : 'blue'
                }`,
              }}
            >
              <div>
                <strong>[{item.severity.toUpperCase()}] {item.title}</strong>
              </div>
              <p>{item.message}</p>
              <small>Posted by: {item.author?.full_name || 'Safety Officer'}</small>

              {/* Edit/Delete controls ONLY rendered for Safety Officers */}
              {isSafetyOfficer && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button onClick={() => startEditing(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ marginLeft: '0.5rem' }}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}