import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import AdminDashboard from "@/components/AdminDashboard";
import UserDashboard from "@/components/UserDashboard";

interface User {
  username: string;
  userType: 'admin' | 'user';
  searchLimit?: number;
  remainingSearches?: number;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return currentUser.userType === 'admin' ? 
    <AdminDashboard onLogout={handleLogout} /> : 
    <UserDashboard user={currentUser} onLogout={handleLogout} />;
};

export default Index;
