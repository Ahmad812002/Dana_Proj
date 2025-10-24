import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/components/Login";
import AdminDashboard from "@/components/AdminDashboard";
import CompanyDashboard from "@/components/CompanyDashboard";
import Settings from "@/components/Settings";
import CompanyManagement from "@/components/CompanyManagement";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowSettings(false);
    setShowCompanyManagement(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              !user ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/"
            element={
              user ? (
                showSettings ? (
                  <Settings onBack={() => setShowSettings(false)} onLogout={handleLogout} />
                ) : showCompanyManagement ? (
                  <CompanyManagement onBack={() => setShowCompanyManagement(false)} />
                ) : user.role === "admin" ? (
                  <AdminDashboard 
                    user={user} 
                    onLogout={handleLogout} 
                    onSettings={() => setShowSettings(true)}
                    onManageCompanies={() => setShowCompanyManagement(true)}
                  />
                ) : (
                  <CompanyDashboard user={user} onLogout={handleLogout} onSettings={() => setShowSettings(true)} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
