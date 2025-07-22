import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, User, AlertCircle, CheckCircle, UserPlus, Trash2, Settings } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";

interface BlockedUser {
  id: string;
  name: string;
  reason: string;
}

interface UserAccount {
  username: string;
  password: string;
  searchLimit: number;
  remainingSearches: number;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<BlockedUser | null | "not_found">(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newBlock, setNewBlock] = useState({
    id: "",
    name: "",
    reason: ""
  });
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    searchLimit: 10
  });
  const [showAdminSettingsForm, setShowAdminSettingsForm] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: ""
  });
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [accountActivity, setAccountActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { 
    searchBlockedUser, 
    addBlockedUser, 
    getBlockedUsers, 
    createUser, 
    getUsers,
    getAccountActivity,
    deleteUser,
    deleteBlockedUser,
    updateAdminCredentials,
    getAdminCredentials
  } = useSupabase();

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    loadData();
    loadAdminCredentials();
  }, []);

  const loadAdminCredentials = () => {
    const credentials = getAdminCredentials();
    setAdminCredentials(credentials);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [blockedData, usersData, activityData] = await Promise.all([
        getBlockedUsers(),
        getUsers(),
        getAccountActivity()
      ]);
      setBlockedUsers(blockedData);
      setUserAccounts(usersData.filter(user => user.user_type === 'user'));
      setAccountActivity(activityData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchId.length !== 12) {
      toast({
        title: "خطأ في البحث",
        description: "يجب أن يكون الرقم التعريفي مكون من 12 رقم بالضبط",
        variant: "destructive"
      });
      return;
    }

    if (!/^\d{12}$/.test(searchId)) {
      toast({
        title: "خطأ في البحث",
        description: "يجب أن يحتوي الرقم التعريفي على أرقام فقط",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const found = await searchBlockedUser(searchId);
      if (found) {
        setSearchResult({
          id: found.user_id,
          name: found.name,
          reason: found.reason
        });
      } else {
        setSearchResult("not_found");
      }
    } catch (error) {
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlock = async () => {
    if (newBlock.id.length !== 12) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون الرقم التعريفي مكون من 12 رقم بالضبط",
        variant: "destructive"
      });
      return;
    }

    if (!/^\d{12}$/.test(newBlock.id)) {
      toast({
        title: "خطأ",
        description: "يجب أن يحتوي الرقم التعريفي على أرقام فقط",
        variant: "destructive"
      });
      return;
    }

    if (!newBlock.name.trim() || !newBlock.reason.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    // التحقق من عدم وجود الرقم مسبقاً
    if (blockedUsers.find(user => user.user_id === newBlock.id)) {
      toast({
        title: "خطأ",
        description: "هذا الرقم التعريفي موجود مسبقاً",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await addBlockedUser({
        user_id: newBlock.id,
        name: newBlock.name,
        reason: newBlock.reason,
        created_by: 'admin'
      }, 'admin');

      setNewBlock({ id: "", name: "", reason: "" });
      setShowAddForm(false);
      await loadData(); // إعادة تحميل البيانات
    } catch (error) {
      // الخطأ يتم التعامل معه في useSupabase
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    if (userAccounts.find(user => user.username === newUser.username)) {
      toast({
        title: "خطأ",
        description: "اسم المستخدم موجود مسبقاً",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await createUser({
        username: newUser.username,
        password: newUser.password,
        user_type: 'user',
        search_limit: newUser.searchLimit,
        remaining_searches: newUser.searchLimit
      });

      setNewUser({ username: "", password: "", searchLimit: 10 });
      setShowCreateUserForm(false);
      await loadData(); // إعادة تحميل البيانات
    } catch (error) {
      // الخطأ يتم التعامل معه في useSupabase
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المستخدم ${username}؟`)) {
      setIsLoading(true);
      try {
        await deleteUser(userId);
        await loadData();
      } catch (error) {
        // الخطأ يتم التعامل معه في useSupabase
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteBlockedUser = async (userId: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من إلغاء حظر ${name}؟`)) {
      setIsLoading(true);
      try {
        await deleteBlockedUser(userId);
        await loadData();
      } catch (error) {
        // الخطأ يتم التعامل معه في useSupabase
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateAdminCredentials = async () => {
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
      setShowAdminSettingsForm(false);
    } catch (error) {
      // الخطأ يتم التعامل معه في useSupabase
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* الهيدر */}
        <div className="flex justify-between items-center mb-8">
          <CarRentalLogo size="md" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">مرحباً، المدير</span>
            <Button 
              onClick={() => setShowAdminSettingsForm(!showAdminSettingsForm)}
              variant="outline" 
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              إعدادات المدير
            </Button>
            <Button onClick={onLogout} variant="outline" size="sm">
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* إعدادات المدير */}
        {showAdminSettingsForm && (
          <Card className="mb-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات المدير
              </CardTitle>
              <CardDescription>
                تغيير اسم المستخدم وكلمة المرور الخاصة بالمدير
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminUsername">اسم المستخدم الجديد</Label>
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
                  <Label htmlFor="adminPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="adminPassword"
                    type="text"
                    placeholder="ادخل كلمة المرور الجديدة"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdateAdminCredentials}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                    disabled={!adminCredentials.username || !adminCredentials.password || isLoading}
                  >
                    {isLoading ? "جاري التحديث..." : "تحديث البيانات"}
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAdminSettingsForm(false);
                      loadAdminCredentials();
                    }}
                    variant="outline"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* واجهة البحث */}
        <Card className="mb-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              البحث عن رقم تعريفي
            </CardTitle>
            <CardDescription>
              ادخل الرقم التعريفي المكون من 12 رقم للبحث في قائمة المحظورين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="ادخل الرقم التعريفي (12 رقم)"
                  value={searchId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setSearchId(value);
                  }}
                  className="text-right"
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  تم إدخال {searchId.length}/12 رقم
                </p>
              </div>
              <Button 
                onClick={handleSearch}
                disabled={searchId.length !== 12 || isLoading}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                {isLoading ? "جارٍ البحث..." : "بحث"}
              </Button>
            </div>

            {/* نتائج البحث */}
            {searchResult && (
              <div className="mt-6">
                {searchResult === "not_found" ? (
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">غير مستدل</span>
                  </div>
                ) : (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-destructive" />
                      <span className="font-medium text-destructive">تم العثور على المستخدم</span>
                    </div>
                    <div className="space-y-2">
                      <p><span className="font-medium">الاسم:</span> {searchResult.name}</p>
                      <p><span className="font-medium">السبب:</span> {searchResult.reason}</p>
                      <p><span className="font-medium">الرقم التعريفي:</span> {searchResult.id}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* إنشاء حساب جديد */}
        <Card className="mb-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  إنشاء حساب مستخدم جديد
                </CardTitle>
                <CardDescription>
                  إنشاء حساب جديد للبحث والإضافة مع حد معين للبحثات
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                variant="outline"
                size="sm"
              >
                {showCreateUserForm ? "إغلاق" : "إنشاء حساب"}
              </Button>
            </div>
          </CardHeader>
          
          {showCreateUserForm && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newUsername">اسم المستخدم</Label>
                  <Input
                    id="newUsername"
                    type="text"
                    placeholder="ادخل اسم المستخدم"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">كلمة المرور</Label>
                  <Input
                    id="newPassword"
                    type="text"
                    placeholder="ادخل كلمة المرور"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="searchLimit">حد البحثات</Label>
                  <Input
                    id="searchLimit"
                    type="number"
                    placeholder="عدد البحثات المسموحة"
                    value={newUser.searchLimit}
                    onChange={(e) => setNewUser(prev => ({ ...prev, searchLimit: parseInt(e.target.value) || 0 }))}
                    className="text-right"
                    min="1"
                  />
                </div>

                <Button 
                  onClick={handleCreateUser}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                  disabled={!newUser.username || !newUser.password || newUser.searchLimit < 1}
                >
                  إنشاء الحساب
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* إضافة بلوك جديد */}
        <Card className="mb-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  إضافة بلوك جديد
                </CardTitle>
                <CardDescription>
                  إضافة رقم تعريفي جديد إلى قائمة المحظورين
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                variant="outline"
                size="sm"
              >
                {showAddForm ? "إغلاق" : "إضافة"}
              </Button>
            </div>
          </CardHeader>
          
          {showAddForm && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newId">الرقم التعريفي (12 رقم)</Label>
                  <Input
                    id="newId"
                    type="text"
                    placeholder="ادخل الرقم التعريفي"
                    value={newBlock.id}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setNewBlock(prev => ({ ...prev, id: value }));
                    }}
                    className="text-right"
                    maxLength={12}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    تم إدخال {newBlock.id.length}/12 رقم
                  </p>
                </div>

                <div>
                  <Label htmlFor="newName">الاسم الثلاثي</Label>
                  <Input
                    id="newName"
                    type="text"
                    placeholder="ادخل الاسم الثلاثي"
                    value={newBlock.name}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, name: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="newReason">السبب</Label>
                  <Input
                    id="newReason"
                    type="text"
                    placeholder="ادخل سبب الحظر"
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, reason: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <Button 
                  onClick={handleAddBlock}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                  disabled={!newBlock.id || !newBlock.name || !newBlock.reason}
                >
                  إضافة البلوك
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* حسابات المستخدمين */}
        <Card className="mb-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              الحسابات المنشأة ({userAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userAccounts.map((user, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                       <p className="font-medium">{user.username}</p>
                       <p className="text-sm text-muted-foreground">
                         البحثات المتبقية: {user.remaining_searches}/{user.search_limit}
                       </p>
                     </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        كلمة المرور: {user.password}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {userAccounts.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  لا توجد حسابات منشأة
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* مراقبة نشاط الحسابات */}
        <Card className="mb-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              مراقبة نشاط الحسابات ({accountActivity.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accountActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  لا توجد أنشطة مسجلة
                </p>
              ) : (
                accountActivity.map((activity, index) => (
                  <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          المستخدم: {activity.username}
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          أضاف حظر للرقم: {activity.blockedUserId}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          {new Date(activity.timestamp).toLocaleString('ar-SA')}
                        </p>
                      </div>
                      <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                        إضافة حظر
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* قائمة المحظورين الحالية */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              قائمة المحظورين ({blockedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
               {blockedUsers.map((user) => (
                 <div key={user.user_id} className="p-3 bg-muted/30 rounded-lg border">
                   <div className="flex justify-between items-start">
                     <div className="space-y-1">
                       <p className="font-medium">{user.name}</p>
                       <p className="text-sm text-muted-foreground">{user.reason}</p>
                       {user.added_by && (
                         <p className="text-xs text-muted-foreground">
                           أضيف بواسطة: {user.added_by}
                         </p>
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-xs text-muted-foreground font-mono">
                         {user.user_id}
                       </span>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleDeleteBlockedUser(user.user_id, user.name)}
                         className="text-destructive hover:text-destructive hover:bg-destructive/10"
                         disabled={isLoading}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 </div>
               ))}
               {blockedUsers.length === 0 && (
                 <p className="text-center text-muted-foreground py-4">
                   لا توجد مستخدمين محظورين
                 </p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;