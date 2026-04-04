import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SavedRecipesProvider } from './context/SavedRecipesContext';
import { FoodLinksProvider } from './context/FoodLinksContext';
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
import MealPlannerPage from './pages/MealPlannerPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SavedRecipesProvider>
        <FoodLinksProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<RequireAuth />}>
            {/* Full-screen post-signup flow (no sidebar) */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AppShellLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/cravings" element={<Cravings />} />
              <Route path="/meal-planner" element={<MealPlannerPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/preferences" element={<Navigate to="/profile" replace />} />
              <Route path="/dietary" element={<Navigate to="/profile" replace />} />
              <Route path="/saved" element={<SavedRecipesPage />} />
              <Route path="/food-links" element={<FoodLinksPage />} />
            </Route>
          </Route>
        </Routes>
        </FoodLinksProvider>
        </SavedRecipesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
