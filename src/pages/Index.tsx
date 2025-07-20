import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import AdminDashboard from "@/components/AdminDashboard";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return isLoggedIn ? <AdminDashboard /> : <LoginForm onLogin={handleLogin} />;
};

export default Index;
