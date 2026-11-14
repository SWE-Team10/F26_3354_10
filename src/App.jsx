import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Employee from './pages/Employee';
import SafetyOfficer from './pages/SafetyOfficer';
import Supervisor from './pages/Supervisor';
import SafetyBoard from './SafetyBoard'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import TaskBoard from './TaskBoard'

const rolePages = {
  employee: { path: '/', label: 'Employee', Component: Employee },
  worker: { path: '/', label: 'Employee', Component: Employee },
  safety_officer: { path: '/SafetyOfficer', label: 'Safety Officer', Component: SafetyOfficer },
  safetyofficer: { path: '/SafetyOfficer', label: 'Safety Officer', Component: SafetyOfficer },
  supervisor: { path: '/Supervisor', label: 'Supervisor', Component: Supervisor },
}

function normalizeRole(role) {
  return role?.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

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
  const rolePage = rolePages[normalizeRole(profile?.role)]

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
        {rolePage && <Link to={rolePage.path}>{rolePage.label}</Link>}
      </nav>

      {/* Dynamic Page Content */}
      <main style={{ padding: '1rem' }}>
        {rolePage ? (
          <Routes>
            <Route
              path={rolePage.path}
              element={<rolePage.Component />}
            />
            <Route
              path="*"
              element={<Navigate to={rolePage.path} replace />}
            />
          </Routes>
        ) : (
          <p>Your account does not have a supported role. Please contact an administrator.</p>
        )}
        <SafetyBoard profile={profile} />
  <hr />
      </main>
    </BrowserRouter>
    </>
  );
}

export default App;