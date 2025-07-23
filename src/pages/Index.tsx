import { useState, useEffect } from "react";
import LoginForm from "@/components/LoginForm";
import AdminDashboard from "@/components/AdminDashboard";
import UserDashboard from "@/components/UserDashboard";
import NavigationBar from "@/components/NavigationBar";
import GuidesPage from "./GuidesPage";
import AdminSettingsPage from "./AdminSettingsPage";
import { initializeData } from "@/lib/initData";

interface User {
  username: string;
  userType: 'admin' | 'user';
  searchLimit?: number;
  remainingSearches?: number;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // تهيئة البيانات الأولية
  useEffect(() => {
    initializeData();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'guides':
        return <GuidesPage />;
      case 'admin-settings':
        return currentUser.userType === 'admin' ? <AdminSettingsPage /> : <GuidesPage />;
      case 'dashboard':
      default:
        return currentUser.userType === 'admin' ? 
          <AdminDashboard onLogout={handleLogout} /> : 
          <UserDashboard user={currentUser} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen">
      <NavigationBar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userType={currentUser.userType}
      />
      {renderCurrentPage()}
    </div>
  );
};

export default Index;
