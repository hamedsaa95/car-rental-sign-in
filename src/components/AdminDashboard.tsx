import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, User, AlertCircle, CheckCircle, UserPlus, Trash2, Settings, MessageCircle } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";
import NewsTickerBar from "./NewsTickerBar";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";
import { supabase } from "@/integrations/supabase/client";
import SupportDashboard from "./SupportDashboard";

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

// دوال التحقق من صحة الرقم المدني الكويتي
const validateKuwaitiCivilId = (civilId: string): { isValid: boolean; birthDate?: Date; age?: number; error?: string } => {
  // التحقق من طول الرقم (12 رقم)
  if (civilId.length !== 12) {
    return { isValid: false, error: "يجب أن يكون الرقم مكون من 12 رقم" };
  }

  // التحقق من أن جميع الأحرف أرقام
  if (!/^\d{12}$/.test(civilId)) {
    return { isValid: false, error: "يجب أن يحتوي على أرقام فقط" };
  }

  // استخراج معلومات التاريخ
  const centuryDigit = parseInt(civilId[0]);
  const yearDigits = parseInt(civilId.substring(1, 3));
  const month = parseInt(civilId.substring(3, 5));
  const day = parseInt(civilId.substring(5, 7));

  // تحديد القرن
  let century: number;
  if (centuryDigit === 2) {
    century = 1900; // القرن العشرين (1900-1999)
  } else if (centuryDigit === 3) {
    century = 2000; // القرن الحادي والعشرين (2000-2099)
  } else {
    return { isValid: false, error: "رقم القرن غير صحيح (يجب أن يكون 2 أو 3)" };
  }

  // تكوين السنة الكاملة
  const fullYear = century + yearDigits;

  // التحقق من صحة الشهر
  if (month < 1 || month > 12) {
    return { isValid: false, error: "الشهر غير صحيح" };
  }

  // التحقق من صحة اليوم
  if (day < 1 || day > 31) {
    return { isValid: false, error: "اليوم غير صحيح" };
  }

  // التحقق من صحة التاريخ
  const birthDate = new Date(fullYear, month - 1, day);
  if (birthDate.getFullYear() !== fullYear || 
      birthDate.getMonth() !== month - 1 || 
      birthDate.getDate() !== day) {
    return { isValid: false, error: "التاريخ غير صحيح" };
  }

  // حساب العمر
  const today = new Date();
  let age = today.getFullYear() - fullYear;
  if (today.getMonth() < month - 1 || 
      (today.getMonth() === month - 1 && today.getDate() < day)) {
    age--;
  }

  // التحقق من العمر (من 18 سنة إلى 104 سنة)
  if (age < 18) {
    return { isValid: false, error: "العمر أقل من 18 سنة" };
  }

  if (age > 104) {
    return { isValid: false, error: "العمر أكبر من 104 سنة" };
  }

  return { isValid: true, birthDate, age };
};

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
    currentUsername: "",
    currentPassword: "",
    newUsername: "",
    newPassword: ""
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
    
    // إعداد real-time updates
    const blockedUsersChannel = supabase
      .channel('blocked_users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocked_users' },
        () => {
          loadData(); // إعادة تحميل البيانات عند أي تغيير
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel('users_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          loadData(); // إعادة تحميل البيانات عند أي تغيير
        }
      )
      .subscribe();

    const activityChannel = supabase
      .channel('activity_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'account_activity' },
        () => {
          loadData(); // إعادة تحميل البيانات عند أي تغيير
        }
      )
      .subscribe();

    // تنظيف الاشتراكات عند إزالة المكون
    return () => {
      supabase.removeChannel(blockedUsersChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(activityChannel);
    };
  }, []);

  const loadAdminCredentials = async () => {
    // Initialize with empty values for security
    setAdminCredentials({
      currentUsername: "",
      currentPassword: "",
      newUsername: "",
      newPassword: ""
    });
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
    // التحقق من صحة الرقم المدني الكويتي
    const validation = validateKuwaitiCivilId(searchId);
    if (!validation.isValid) {
      toast({
        title: "رقم تعريفي غير صحيح",
        description: validation.error || "الرقم التعريفي غير صالح للبحث",
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
    // التحقق من صحة الرقم المدني الكويتي
    const validation = validateKuwaitiCivilId(newBlock.id);
    if (!validation.isValid) {
      toast({
        title: "رقم تعريفي غير صحيح",
        description: validation.error || "الرقم التعريفي غير صالح للإضافة",
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
    if (!adminCredentials.currentUsername.trim() || !adminCredentials.currentPassword.trim() ||
        !adminCredentials.newUsername.trim() || !adminCredentials.newPassword.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    if (adminCredentials.newUsername.length < 3) {
      toast({
        title: "خطأ",
        description: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    if (adminCredentials.newPassword.length < 4) {
      toast({
        title: "خطأ", 
        description: "كلمة المرور يجب أن تكون 4 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateAdminCredentials(
        adminCredentials.currentUsername,
        adminCredentials.currentPassword,
        adminCredentials.newUsername,
        adminCredentials.newPassword
      );
      setShowAdminSettingsForm(false);
      setAdminCredentials({
        currentUsername: "",
        currentPassword: "",
        newUsername: "",
        newPassword: ""
      });
    } catch (error) {
      // الخطأ يتم التعامل معه في useSupabase
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* شريط الأخبار */}
      <NewsTickerBar onDataUpdate={loadData} />
      
      <div className="p-4">
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
                  <Label htmlFor="currentUsername">اسم المستخدم الحالي</Label>
                  <Input
                    id="currentUsername"
                    type="text"
                    placeholder="ادخل اسم المستخدم الحالي"
                    value={adminCredentials.currentUsername}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, currentUsername: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="ادخل كلمة المرور الحالية"
                    value={adminCredentials.currentPassword}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="newUsername">اسم المستخدم الجديد</Label>
                  <Input
                    id="newUsername"
                    type="text"
                    placeholder="ادخل اسم المستخدم الجديد"
                    value={adminCredentials.newUsername}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, newUsername: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="ادخل كلمة المرور الجديدة"
                    value={adminCredentials.newPassword}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdateAdminCredentials}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                    disabled={!adminCredentials.currentUsername || !adminCredentials.currentPassword || 
                             !adminCredentials.newUsername || !adminCredentials.newPassword || isLoading}
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

        {/* التبويبات الرئيسية */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">البحث والإدارة</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="blocked">المحظورين</TabsTrigger>
            <TabsTrigger value="support">الدعم المباشر</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* إنشاء حساب جديد */}
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
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

          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* قائمة المستخدمين */}
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  قائمة المستخدمين ({userAccounts.length})
                </CardTitle>
                <CardDescription>
                  إدارة حسابات المستخدمين وحد البحثات الخاص بكل منهم
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userAccounts.map((user, index) => (
                      <div key={user.id || index} className="p-4 bg-muted/30 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="font-medium text-lg">{user.username}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <p className="text-muted-foreground">
                                <span className="font-medium">البحثات المتبقية:</span> {user.remaining_searches}
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-medium">الحد الأقصى:</span> {user.search_limit}
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-medium">كلمة المرور:</span> {user.password}
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-medium">تاريخ الإنشاء:</span> {new Date(user.created_at).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {userAccounts.length === 0 && (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">لا توجد حسابات مستخدمين</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          يمكنك إنشاء حساب جديد من تبويب "البحث والإدارة"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked" className="space-y-6">
            {/* قائمة المحظورين */}
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  قائمة المحظورين ({blockedUsers.length})
                </CardTitle>
                <CardDescription>
                  عرض وإدارة قائمة الأشخاص المحظورين في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((user, index) => (
                      <div key={user.id || index} className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="font-medium text-lg">{user.name}</p>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                              <p className="text-muted-foreground">
                                <span className="font-medium">الرقم التعريفي:</span> {user.user_id}
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-medium">سبب الحظر:</span> {user.reason}
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-medium">تاريخ الإضافة:</span> {new Date(user.created_at).toLocaleDateString('ar-SA')}
                              </p>
                              {user.created_by && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">أضيف بواسطة:</span> {user.created_by}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBlockedUser(user.user_id, user.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            إلغاء الحظر
                          </Button>
                        </div>
                      </div>
                    ))}
                    {blockedUsers.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">لا توجد حسابات محظورة</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          يمكنك إضافة حساب محظور من تبويب "البحث والإدارة"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <SupportDashboard />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;