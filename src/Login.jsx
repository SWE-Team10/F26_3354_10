import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} style={{ maxWidth: '320px', margin: '2rem auto' }}>
      <h2>Sign In</h2>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="email"
          placeholder="Email (e.g. supervisor@test.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: '8px' }}>
        {loading ? 'Signing in...' : 'Log In'}
      </button>
    </form>
  )
}