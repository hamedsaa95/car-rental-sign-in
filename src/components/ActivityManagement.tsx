import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Activity, Search, Calendar, User, Shield } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

interface ActivityRecord {
  id: string;
  username: string;
  action: string;
  blocked_user_id?: string;
  timestamp: string;
}

const ActivityManagement: React.FC = () => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { getAccountActivity } = useSupabase();
  const { toast } = useToast();

  // تحميل البيانات
  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const data = await getAccountActivity();
      setActivities(data as ActivityRecord[]);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات النشاط",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  // فلترة الأنشطة
  const filteredActivities = activities.filter(activity =>
    activity.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.blocked_user_id && activity.blocked_user_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    activity.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'added_block':
        return 'إضافة حظر';
      case 'removed_block':
        return 'إلغاء حظر';
      case 'login':
        return 'تسجيل دخول';
      case 'logout':
        return 'تسجيل خروج';
      case 'search':
        return 'بحث';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'added_block':
        return 'bg-red-500';
      case 'removed_block':
        return 'bg-green-500';
      case 'login':
        return 'bg-blue-500';
      case 'logout':
        return 'bg-gray-500';
      case 'search':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // إحصائيات
  const stats = {
    total: activities.length,
    today: activities.filter(a => {
      const today = new Date().toDateString();
      return new Date(a.timestamp).toDateString() === today;
    }).length,
    blocks: activities.filter(a => a.action === 'added_block').length,
    searches: activities.filter(a => a.action === 'search').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة النشاط</h2>
        <Button onClick={loadActivities} variant="outline" disabled={isLoading}>
          {isLoading ? "جاري التحميل..." : "تحديث"}
        </Button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأنشطة</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">اليوم</p>
                <p className="text-2xl font-bold text-green-600">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">عمليات حظر</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">عمليات بحث</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.searches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث بالمستخدم أو النشاط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة الأنشطة */}
      <Card>
        <CardHeader>
          <CardTitle>سجل النشاط ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{activity.username}</span>
                      <Badge className={`text-white ${getActionColor(activity.action)}`}>
                        {getActionLabel(activity.action)}
                      </Badge>
                    </div>
                    {activity.blocked_user_id && (
                      <p className="text-sm text-muted-foreground">
                        الرقم التعريفي: {activity.blocked_user_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filteredActivities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد نشاط</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityManagement;