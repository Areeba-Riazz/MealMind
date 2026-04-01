import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../my-app/src/context/AuthContext';
import Navbar from '../../my-app/src/components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Cravings from './pages/Cravings';
import './globals.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cravings" element={<Cravings />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
