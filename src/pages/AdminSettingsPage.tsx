import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Users, Activity, Database, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";

const AdminSettingsPage = () => {
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: ""
  });
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalBlocked: 0,
    totalSearches: 0
  });
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    systemUpdates: true,
    userActivity: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { 
    updateAdminCredentials,
    getAdminCredentials,
    getUsers,
    getBlockedUsers,
    getAccountActivity
  } = useSupabase();

  useEffect(() => {
    loadAdminData();
    loadSystemStats();
  }, []);

  const loadAdminData = async () => {
    const credentials = await getAdminCredentials();
    setAdminCredentials(credentials);
  };

  const loadSystemStats = async () => {
    try {
      const [users, blocked, activity] = await Promise.all([
        getUsers(),
        getBlockedUsers(),
        getAccountActivity()
      ]);
      
      setSystemStats({
        totalUsers: users.filter(u => u.user_type === 'user').length,
        totalBlocked: blocked.length,
        totalSearches: activity.filter(a => a.action === 'search').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!adminCredentials.username.trim() || !adminCredentials.password.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    if (adminCredentials.username.length < 3) {
      toast({
        title: "خطأ",
        description: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    if (adminCredentials.password.length < 4) {
      toast({
        title: "خطأ", 
        description: "كلمة المرور يجب أن تكون 4 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateAdminCredentials(adminCredentials.username, adminCredentials.password);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المدير بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحديث",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "تم التحديث",
      description: "تم تحديث إعدادات الإشعارات"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">إعدادات المدير</h1>
          <p className="text-muted-foreground">
            إدارة الحساب والنظام والإعدادات العامة
          </p>
        </div>

        {/* System Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{systemStats.totalUsers}</h3>
              <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-destructive mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{systemStats.totalBlocked}</h3>
              <p className="text-sm text-muted-foreground">المستخدمين المحظورين</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
            <CardContent className="p-6 text-center">
              <Activity className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{systemStats.totalSearches}</h3>
              <p className="text-sm text-muted-foreground">إجمالي البحثات</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Credentials */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              بيانات المدير
            </CardTitle>
            <CardDescription>
              تحديث اسم المستخدم وكلمة المرور الخاصة بالمدير
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminUsername">اسم المستخدم</Label>
                  <Input
                    id="adminUsername"
                    type="text"
                    placeholder="ادخل اسم المستخدم الجديد"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="adminPassword">كلمة المرور</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="ادخل كلمة المرور الجديدة"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="text-right"
                  />
                </div>
              </div>

              <Button 
                onClick={handleUpdateCredentials}
                className="bg-gradient-to-r from-primary to-primary-glow"
                disabled={!adminCredentials.username || !adminCredentials.password || isLoading}
              >
                {isLoading ? "جاري التحديث..." : "تحديث البيانات"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              إعدادات الإشعارات
            </CardTitle>
            <CardDescription>
              تخصيص الإشعارات والتنبيهات التي تريد استقبالها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">إشعارات البريد الإلكتروني</h4>
                  <p className="text-sm text-muted-foreground">استقبال إشعارات مهمة عبر البريد الإلكتروني</p>
                </div>
                <Button
                  variant={notifications.emailAlerts ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleNotificationChange('emailAlerts', !notifications.emailAlerts)}
                >
                  {notifications.emailAlerts ? "مفعل" : "معطل"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">تحديثات النظام</h4>
                  <p className="text-sm text-muted-foreground">إشعارات حول تحديثات النظام والصيانة</p>
                </div>
                <Button
                  variant={notifications.systemUpdates ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleNotificationChange('systemUpdates', !notifications.systemUpdates)}
                >
                  {notifications.systemUpdates ? "مفعل" : "معطل"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">نشاط المستخدمين</h4>
                  <p className="text-sm text-muted-foreground">إشعارات عند قيام المستخدمين بعمليات بحث</p>
                </div>
                <Button
                  variant={notifications.userActivity ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleNotificationChange('userActivity', !notifications.userActivity)}
                >
                  {notifications.userActivity ? "مفعل" : "معطل"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              معلومات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">إصدار النظام:</span>
                  <Badge variant="secondary">v1.0.0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">آخر تحديث:</span>
                  <span className="text-sm text-muted-foreground">23 يوليو 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">حالة النظام:</span>
                  <Badge variant="default" className="bg-green-500">متصل</Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">قاعدة البيانات:</span>
                  <Badge variant="outline">Supabase</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">المنطقة الزمنية:</span>
                  <span className="text-sm text-muted-foreground">GMT+3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">اللغة:</span>
                  <span className="text-sm text-muted-foreground">العربية</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettingsPage;