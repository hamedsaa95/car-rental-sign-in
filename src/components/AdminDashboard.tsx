import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Shield, Activity } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";
import NewsTickerBar from "./NewsTickerBar";
import SupportDashboard from "./SupportDashboard";
import AdvertisementManager from "./AdvertisementManager";
import AdminSettingsDialog from "./AdminSettingsDialog";
import { useSupabase } from "@/hooks/useSupabase";

interface User {
  id?: string;
  username: string;
  user_type: 'admin' | 'user';
  search_limit?: number;
  remaining_searches?: number;
  phone_number?: string;
  company_name?: string;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const [currentView, setCurrentView] = useState<'overview' | 'support' | 'ads'>('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlocked: 0,
    totalMessages: 0,
    totalActivity: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    getBlockedUsers, 
    getUsers,
    getAccountActivity
  } = useSupabase();

  // تحميل الإحصائيات
  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [blockedData, usersData, activityData] = await Promise.all([
        getBlockedUsers(),
        getUsers(),
        getAccountActivity()
      ]);
      
      setStats({
        totalUsers: usersData.filter(user => user.user_type === 'user').length,
        totalBlocked: blockedData.length,
        totalMessages: 0, // يمكن إضافة عداد للرسائل لاحقاً
        totalActivity: activityData.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'support':
        return <SupportDashboard />;
      case 'ads':
        return <AdvertisementManager username={user.username} />;
      default:
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* إحصائيات النظام */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المستخدمين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">إجمالي المستخدمين المسجلين</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المحظورين</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBlocked}</div>
                <p className="text-xs text-muted-foreground">إجمالي الحسابات المحظورة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">رسائل الدعم</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
                <p className="text-xs text-muted-foreground">رسائل الدعم الجديدة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">النشاط</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActivity}</div>
                <p className="text-xs text-muted-foreground">إجمالي العمليات المسجلة</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* شريط الأخبار */}
      <NewsTickerBar />
      
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          {/* الهيدر */}
          <div className="flex justify-between items-center mb-8">
            <CarRentalLogo size="md" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">مرحباً، المدير</span>
              <Button 
                onClick={() => setCurrentView('overview')}
                variant={currentView === 'overview' ? "default" : "outline"}
                size="sm"
              >
                لوحة التحكم
              </Button>
              <Button 
                onClick={() => setCurrentView('support')}
                variant={currentView === 'support' ? "default" : "outline"}
                size="sm"
              >
                إدارة الدعم
              </Button>
              <Button 
                onClick={() => setCurrentView('ads')}
                variant={currentView === 'ads' ? "default" : "outline"}
                size="sm"
              >
                إدارة الإعلانات
              </Button>
              <AdminSettingsDialog isOpen={false} onClose={() => {}} />
              <Button onClick={onLogout} variant="outline" size="sm">
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* المحتوى الحالي */}
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;