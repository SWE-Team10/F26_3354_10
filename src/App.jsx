import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Employee from './pages/Employee';
import SafetyOfficer from './pages/SafetyOfficer';
import Supervisor from './pages/Supervisor';

function App() {
  return (
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
  );
}

export default App;