import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, UserX, Search, Plus, Trash2, MessageCircle, Phone, Building, Shield } from 'lucide-react';
import { useSupabase, User, BlockedUser } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    getUsers, 
    getBlockedUsers, 
    deleteUser, 
    addBlockedUser, 
    deleteBlockedUser 
  } = useSupabase();
  const { toast } = useToast();

  // تحميل البيانات
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, blockedData] = await Promise.all([
        getUsers(),
        getBlockedUsers()
      ]);
      setUsers(usersData as User[]);
      setBlockedUsers(blockedData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // فلترة المستخدمين
  const filteredUsers = users.filter(user => 
    user.user_type === 'user' && 
    (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredBlockedUsers = blockedUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // حظر مستخدم
  const blockUser = async () => {
    if (!selectedUser || !blockReason.trim()) return;

    try {
      await addBlockedUser({
        user_id: selectedUser.id || selectedUser.username,
        name: selectedUser.username,
        reason: blockReason.trim()
      }, 'admin');

      toast({
        title: "تم الحظر",
        description: `تم حظر المستخدم ${selectedUser.username}`,
      });

      setBlockReason('');
      setIsBlockDialogOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  // إلغاء حظر مستخدم
  const unblockUser = async (userId: string, userName: string) => {
    try {
      await deleteBlockedUser(userId);
      toast({
        title: "تم إلغاء الحظر",
        description: `تم إلغاء حظر المستخدم ${userName}`,
      });
      loadData();
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  // حذف مستخدم
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم ${userName}؟`)) return;

    try {
      await deleteUser(userId);
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // إرسال رسالة واتساب
  const sendWhatsApp = (phoneNumber: string, message: string) => {
    if (!phoneNumber) {
      toast({
        title: "خطأ",
        description: "رقم الهاتف غير متوفر",
        variant: "destructive",
      });
      return;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
        <Button onClick={loadData} variant="outline" disabled={isLoading}>
          {isLoading ? "جاري التحميل..." : "تحديث"}
        </Button>
      </div>

      {/* شريط البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث بالاسم أو الشركة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المستخدمين ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            المحظورين ({filteredBlockedUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* قائمة المستخدمين */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>قائمة المستخدمين المسجلين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{user.username}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {user.company_name && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {user.company_name}
                            </div>
                          )}
                          {user.phone_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone_number}
                            </div>
                          )}
                          <div>
                            البحثات المتبقية: {user.remaining_searches || 0} / {user.search_limit || 0}
                          </div>
                        </div>
                        {user.created_at && (
                          <p className="text-xs text-muted-foreground">
                            تاريخ التسجيل: {formatTime(user.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {user.phone_number && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsApp(user.phone_number!, `مرحباً ${user.username}, نتواصل معك من خدمة عملاء شركة تأجير السيارات.`)}
                          className="flex items-center gap-1"
                        >
                          <WhatsAppIcon />
                          واتساب
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsBlockDialogOpen(true);
                        }}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Shield className="h-4 w-4" />
                        حظر
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id!, user.username)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا يوجد مستخدمين</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* قائمة المحظورين */}
        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle>قائمة المستخدمين المحظورين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredBlockedUsers.map((blockedUser) => (
                  <div key={blockedUser.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <UserX className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{blockedUser.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          معرف المستخدم: {blockedUser.user_id}
                        </p>
                        <p className="text-sm text-red-600">
                          سبب الحظر: {blockedUser.reason}
                        </p>
                        {blockedUser.created_at && (
                          <p className="text-xs text-muted-foreground">
                            تاريخ الحظر: {formatTime(blockedUser.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unblockUser(blockedUser.user_id, blockedUser.name)}
                        className="text-green-600 hover:text-green-700"
                      >
                        إلغاء الحظر
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredBlockedUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا يوجد مستخدمين محظورين</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة حظر المستخدم */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حظر المستخدم</DialogTitle>
            <DialogDescription>
              {selectedUser && `هل أنت متأكد من حظر المستخدم "${selectedUser.username}"؟`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">سبب الحظر</Label>
              <Textarea
                id="reason"
                placeholder="اكتب سبب حظر هذا المستخدم..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBlockDialogOpen(false);
                  setBlockReason('');
                  setSelectedUser(null);
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={blockUser}
                disabled={!blockReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                تأكيد الحظر
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;