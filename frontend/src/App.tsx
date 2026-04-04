import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SavedRecipesProvider } from './context/SavedRecipesContext';
import RequireAuth from './components/RequireAuth';
import AppShellLayout from './components/AppShellLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DemoPage from './pages/DemoPage';
import Cravings from './pages/Cravings';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SavedRecipesPage from './pages/SavedRecipesPage';
import FoodLinksPage from './pages/FoodLinksPage';
import OnboardingPage from './pages/OnboardingPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SavedRecipesProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShellLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/cravings" element={<Cravings />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/preferences" element={<Navigate to="/profile" replace />} />
              <Route path="/dietary" element={<Navigate to="/profile" replace />} />
              <Route path="/saved" element={<SavedRecipesPage />} />
              <Route path="/food-links" element={<FoodLinksPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>
          </Route>
        </Routes>
        </SavedRecipesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
