import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function TaskBoard({ canDelete = false }) {
  const [tasks, setTasks] = useState([])
  const [message, setMessage] = useState('')

  // 1. Fetch tasks (RLS automatically returns all tasks for supervisors,
  //    or only assigned tasks for workers)
  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, worker:assigned_to(full_name)')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching tasks:', error)
    else setTasks(data)
  }

  async function deleteTask(id) {
    if (!canDelete) {
      setMessage('You do not have permission to remove tasks.')
      return
    }

    setMessage('')
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      setMessage('Failed to remove task: ' + error.message)
      return
    }
    if (!data) {
      setMessage('Task was not removed. It may no longer exist or you may not have permission.')
      return
    }

    setMessage('Task removed.')
    await fetchTasks()
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return (
    <div>
      <h2>Tasks</h2>
      {message && <p role="status">{message}</p>}
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.title}</strong> — {task.status} (Assigned to: {task.worker?.full_name})
            {canDelete && (
              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                aria-label={`Remove task: ${task.title}`}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}