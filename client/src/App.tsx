import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Comments from "./pages/Comments";
import Navbar from "./components/Navbar";
import "./App.css";
import { useAuth } from "./context/useAuth";
import { useState, useEffect } from "react";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, validateAndRefreshToken } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      if (!isAuthenticated) {
        if (!cancelled) {
          setIsValid(false);
          setIsValidating(false);
        }
        return;
      }

      const valid = await validateAndRefreshToken();
      if (!cancelled) {
        setIsValid(valid);
        setIsValidating(false);
      }
    };

    checkAuth();

    return () => { cancelled = true; };
  }, [isAuthenticated, validateAndRefreshToken]);

  if (isValidating) {
    return <div>Loading...</div>;
  }

  return isValid ? <>{children}</> : <Navigate to="/auth" />;
};

function AppContent() {
  const location = useLocation();
  const showNavbar = !location.pathname.startsWith("/auth");

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/posts/:postId/comments" element={<Comments />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
