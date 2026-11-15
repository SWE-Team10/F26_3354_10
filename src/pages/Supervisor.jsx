import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// If any of these tables have different names in Supabase, change them here.
const CHECKINS_TABLE = 'check_ins'
const REPORTS_TABLE = 'reports'
const CERTS_TABLE = 'equipment_certifications'

const box = { display: 'grid', gap: '0.5rem', maxWidth: 400, margin: '0 auto 1rem' }

// FR-8: assign a task to a worker (same logic as your TaskBoard)
function AssignTask() {
  const [workers, setWorkers] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'worker')
      .then(({ data, error }) => {
        if (!error) setWorkers(data)
      })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('')
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('tasks').insert([
      { title, description, assigned_to: workerId, assigned_by: user.id },
    ])

    if (error) {
      setStatus('Failed to assign task: ' + error.message)
    } else {
      setStatus('Task assigned.')
      setTitle('')
      setDescription('')
      setWorkerId('')
    }
  }

  return (
    <section>
      <h2>Assign Task</h2>
      <form onSubmit={handleSubmit} style={box}>
        <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} required>
          <option value="">Select worker...</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>{w.full_name}</option>
          ))}
        </select>
        <button type="submit">Assign</button>
      </form>
      {status && <p>{status}</p>}
    </section>
  )
}

// FR-4: check-in/out logs organized by date and worker
function CheckLogs() {
  const [logs, setLogs] = useState([])
  const [date, setDate] = useState('')

  useEffect(() => {
    async function load() {
      let query = supabase
        .from(CHECKINS_TABLE)
        .select('id, type, created_at, worker:worker_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(200)

      if (date) {
        const start = new Date(date + 'T00:00:00')
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
      }

      const { data, error } = await query
      if (error) console.error('Error fetching logs:', error.message)
      else setLogs(data)
    }
    load()
  }, [date])

  return (
    <section>
      <h2>Check-In / Check-Out Logs</h2>
      <label>Date: </label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      {logs.length === 0 ? (
        <p>No records.</p>
      ) : (
        <table style={{ margin: '1rem auto' }}>
          <thead>
            <tr><th>Worker</th><th>Action</th><th>Time</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.worker?.full_name}</td>
                <td>{l.type === 'check_in' ? 'Check in' : 'Check out'}</td>
                <td>{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

// FR-5 / FR-6: report a hazard zone or a safety violation
function ReportForm() {
  const [type, setType] = useState('hazard')
  const [area, setArea] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('Low')
  const [status, setStatus] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('')
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from(REPORTS_TABLE).insert([
      {
        type,
        area,
        description,
        severity: type === 'hazard' ? severity : null,
        reported_by: user.id,
      },
    ])

    if (error) {
      setStatus('Failed to submit: ' + error.message)
    } else {
      setStatus('Report submitted (status: Open).')
      setArea('')
      setDescription('')
    }
  }

  return (
    <section>
      <h2>Report Hazard / Violation</h2>
      <form onSubmit={handleSubmit} style={box}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="hazard">Hazard Zone</option>
          <option value="violation">Safety Violation</option>
        </select>
        <input placeholder="Site area" value={area} onChange={(e) => setArea(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        {type === 'hazard' && (
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        )}
        <button type="submit">Submit</button>
      </form>
      {status && <p>{status}</p>}
    </section>
  )
}

// FR-10: view equipment certifications (read-only for supervisors)
function Certifications() {
  const [certs, setCerts] = useState([])

  useEffect(() => {
    supabase
      .from(CERTS_TABLE)
      .select('*')
      .order('expiration_date', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error fetching certifications:', error.message)
        else setCerts(data)
      })
  }, [])

  return (
    <section>
      <h2>Equipment Certifications</h2>
      {certs.length === 0 ? (
        <p>No certification records.</p>
      ) : (
        <table style={{ margin: '1rem auto' }}>
          <thead>
            <tr><th>ID</th><th>Type</th><th>Expires</th></tr>
          </thead>
          <tbody>
            {certs.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.equipment_type}</td>
                <td>{c.expiration_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default function Supervisor() {
  return (
    <div>
      <h1>Supervisor Dashboard</h1>
      <AssignTask />
      <CheckLogs />
      <ReportForm />
      <Certifications />
    </div>
  )
}
