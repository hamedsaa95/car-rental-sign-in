import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import AdminDashboard from "@/components/AdminDashboard";
import UserDashboard from "@/components/UserDashboard";
import { useAuth } from "@/hooks/useAuth";
import NavigationBar from "@/components/NavigationBar";
import GuidesPage from "./GuidesPage";
import AdminSettingsPage from "./AdminSettingsPage";

export interface User {
  id?: string;
  username: string;
  user_type: 'admin' | 'user';
  search_limit?: number;
  remaining_searches?: number;
  phone_number?: string;
  company_name?: string;
}

const Index = () => {
  const { user, isLoading, login, logout, updateUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = (userData: User) => {
    login(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'guides':
        return <GuidesPage />;
      case 'admin-settings':
        return user.user_type === 'admin' ? <AdminSettingsPage /> : <GuidesPage />;
      case 'dashboard':
      default:
        return user.user_type === 'admin' ? 
          <AdminDashboard user={user} onLogout={handleLogout} /> : 
          <UserDashboard user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen">
      <NavigationBar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userType={user.user_type}
      />
      {renderCurrentPage()}
    </div>
  );
};

export default Index;
