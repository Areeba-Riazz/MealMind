import './globals.css';
import Navbar from '../../../my-app/src/components/Navbar';
import { AuthProvider } from '../../../my-app/src/context/AuthContext';

export const metadata = {
  title: 'MealMind | Stop stressing about what to eat',
  description: 'AI-powered tool that helps you make meal decisions with less mental effort. Tell us what you have, we tell you what to make.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="bg-glow-1"></div>
          <div className="bg-glow-2"></div>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
