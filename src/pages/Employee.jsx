import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// If your check-in table has a different name in Supabase, change it here.
const CHECKINS_TABLE = 'check_ins'

export default function Employee() {
  const [tasks, setTasks] = useState([])
  const [lastEvent, setLastEvent] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // FR-9: only this worker's tasks
  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching tasks:', error.message)
    else setTasks(data)
  }

  // Find out whether the worker is currently checked in or out
  async function fetchLastEvent() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from(CHECKINS_TABLE)
      .select('type, created_at')
      .eq('worker_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) console.error('Error fetching check-in status:', error.message)
    else setLastEvent(data)
  }

  // FR-3: record check-in / check-out (worker ID + timestamp)
  async function handleCheck(type) {
    setLoading(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from(CHECKINS_TABLE)
      .insert([{ worker_id: user.id, type }])

    if (error) {
      setMessage('Failed: ' + error.message)
    } else {
      setMessage(type === 'check_in' ? 'Checked in.' : 'Checked out.')
      fetchLastEvent()
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
    fetchLastEvent()
  }, [])

  const isCheckedIn = lastEvent?.type === 'check_in'

  return (
    <div>
      <h1>Employee Dashboard</h1>

      <section>
        <h2>Site Check-In / Check-Out</h2>
        <p>
          Status: <strong>{isCheckedIn ? 'Checked in' : 'Checked out'}</strong>
          {lastEvent && <> (since {new Date(lastEvent.created_at).toLocaleString()})</>}
        </p>
        <button onClick={() => handleCheck('check_in')} disabled={loading || isCheckedIn}>
          Check In
        </button>{' '}
        <button onClick={() => handleCheck('check_out')} disabled={loading || !isCheckedIn}>
          Check Out
        </button>
        {message && <p>{message}</p>}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>My Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks assigned.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li key={task.id} style={{ marginBottom: '0.5rem' }}>
                <strong>{task.title}</strong> — {task.status}
                {task.description && <div>{task.description}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
