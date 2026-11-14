import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Employee from './pages/Employee';
import SafetyOfficer from './pages/SafetyOfficer';
import Supervisor from './pages/Supervisor';

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import TaskBoard from './TaskBoard'
function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    //login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    if (!error) setProfile(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return <p>Loading...</p>

  // Not logged in -> show Login screen
  if (!session) return <Login />
  return (
    <>
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
        <span>
          Logged in as <strong>{profile?.full_name}</strong> ({profile?.role})
        </span>
        <button onClick={handleLogout}>Log Out</button>
      </header>

      {/* Pass profile down so TaskBoard knows whether to show the "Assign Task" form */}
      <TaskBoard profile={profile} />
    </div>
    <BrowserRouter>
      {/* Nav Bar */}
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc', backgroundColor: "hsl(192, 75%, 37%)" }}>
        <Link to="/">Employee</Link>
        <Link to="/SafetyOfficer">Safety Officer</Link>
        <Link to="/Supervisor">Supervisor</Link>
      </nav>

      {/* Dynamic Page Content */}
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Employee />} />
          <Route path="/SafetyOfficer" element={<SafetyOfficer />} />
          <Route path="/Supervisor" element={<Supervisor />} />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </main>
    </BrowserRouter>
    </>
  );
}

export default App;