import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const EQUIPMENT_SAFETY_TABLE = 'equipment_safety'
const box = { display: 'grid', gap: '0.5rem', maxWidth: 400, margin: '0 auto 1rem' }

export default function EquipmentSafety({ isSafetyOfficer = false }) {
  const [items, setItems] = useState([])
  const [equipmentName, setEquipmentName] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [concern, setConcern] = useState('')
  const [severity, setSeverity] = useState('Medium')
  const [status, setStatus] = useState('')

  async function loadItems() {
    const { data, error } = await supabase
      .from(EQUIPMENT_SAFETY_TABLE)
      .select('*, author:reported_by(full_name, role)')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching equipment safety:', error.message)
    else setItems(data)
  }

  useEffect(() => {
    loadItems()
  }, [])

  // Both Supervisors and Safety Officers can add; deletion is restricted to Safety Officers.
  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('')
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from(EQUIPMENT_SAFETY_TABLE).insert([
      {
        equipment_name: equipmentName,
        equipment_id: equipmentId || null,
        concern,
        severity,
        reported_by: user.id,
      },
    ])

    if (error) {
      setStatus('Failed to add: ' + error.message)
    } else {
      setStatus('Equipment safety concern logged.')
      setEquipmentName('')
      setEquipmentId('')
      setConcern('')
      setSeverity('Medium')
      loadItems()
    }
  }

  // Only Safety Officers can delete (enforced by UI + Supabase RLS)
  async function handleDelete(id) {
    if (!isSafetyOfficer) {
      setStatus('Only Safety Officers can remove equipment concerns.')
      return
    }

    const { data, error } = await supabase
      .from(EQUIPMENT_SAFETY_TABLE)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      setStatus('Failed to remove: ' + error.message)
    } else if (!data) {
      setStatus('Concern was not removed. It may no longer exist or you may not have permission.')
    } else {
      setStatus('Equipment safety concern removed.')
      await loadItems()
    }
  }

  return (
    <section>
      <h2>Equipment Safety Concerns</h2>

      {/* Both Supervisors and Safety Officers can add concerns. */}
      <form onSubmit={handleSubmit} style={box}>
        <input
          placeholder="Equipment name (e.g., Forklift #2)"
          value={equipmentName}
          onChange={(e) => setEquipmentName(e.target.value)}
          required
        />
        <input
          placeholder="Equipment / Asset ID (optional)"
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
        />
        <textarea
          placeholder="Describe the safety concern..."
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
          required
        />
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button type="submit">Log Equipment Concern</button>
      </form>
      {status && <p>{status}</p>}

      {/* Table of active equipment concerns */}
      {items.length === 0 ? (
        <p>No active equipment safety concerns.</p>
      ) : (
        <table style={{ margin: '1rem auto' }}>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>ID</th>
              <th>Concern</th>
              <th>Severity</th>
              <th>Reported By</th>
              {isSafetyOfficer && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.equipment_name}</td>
                <td>{item.equipment_id || '—'}</td>
                <td>{item.concern}</td>
                <td>{item.severity}</td>
                <td>{item.author?.full_name || 'Unknown'}</td>
                {isSafetyOfficer && (
                  <td>
                    <button type="button" onClick={() => handleDelete(item.id)}>Remove</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}