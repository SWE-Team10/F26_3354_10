import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function TaskBoard() {
  const [tasks, setTasks] = useState([])
  const [workers, setWorkers] = useState([])

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

  // 2. Fetch workers (for the supervisor's assignment dropdown)
  async function fetchWorkers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'worker')

    if (!error) setWorkers(data)
  }

  // 3. Assign a new task (Supervisor action)
  async function assignTask(title, description, workerId) {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('tasks').insert([
      {
        title,
        description,
        assigned_to: workerId,
        assigned_by: user.id, // Must match logged-in supervisor's ID per RLS
      },
    ])

    if (error) {
      alert('Failed to assign task: ' + error.message)
    } else {
      fetchTasks() // Refresh the task list
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchWorkers()
  }, [])

  return (
    <div>
      <h2>Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.title}</strong> — {task.status} (Assigned to: {task.worker?.full_name})
          </li>
        ))}
      </ul>
    </div>
  )
}