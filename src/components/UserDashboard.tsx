import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, AlertCircle, CheckCircle, User as UserIcon } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";

interface BlockedUser {
  id: string;
  name: string;
  reason: string;
}

interface User {
  id?: string;
  username: string;
  userType: 'admin' | 'user';
  searchLimit?: number;
  remainingSearches?: number;
}

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

const UserDashboard = ({ user, onLogout }: UserDashboardProps) => {
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<BlockedUser | null | "not_found">(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlock, setNewBlock] = useState({
    id: "",
    name: "",
    reason: ""
  });
  const [remainingSearches, setRemainingSearches] = useState(user.remainingSearches || 0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { 
    searchBlockedUser, 
    addBlockedUser, 
    updateUserSearches 
  } = useSupabase();

  const handleSearch = async () => {
    if (remainingSearches <= 0) {
      toast({
        title: "تم استنفاد البحثات",
        description: "لا توجد بحثات متبقية",
        variant: "destructive"
      });
      return;
    }

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
      
      const newCount = remainingSearches - 1;
      setRemainingSearches(newCount);
      
      // تحديث عدد البحثات في قاعدة البيانات
      if (user.id) {
        await updateUserSearches(user.id, newCount);
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

    setIsLoading(true);
    try {
      // التحقق من عدم وجود الرقم مسبقاً
      const existing = await searchBlockedUser(newBlock.id);
      if (existing) {
        toast({
          title: "خطأ",
          description: "هذا الرقم التعريفي موجود مسبقاً",
          variant: "destructive"
        });
        return;
      }

      await addBlockedUser({
        user_id: newBlock.id,
        name: newBlock.name,
        reason: newBlock.reason,
        created_by: user.username
      });

      setNewBlock({ id: "", name: "", reason: "" });
      setShowAddForm(false);
      
      // إضافة 5 بحثات عند الإضافة الناجحة
      const newCount = remainingSearches + 5;
      setRemainingSearches(newCount);
      
      // تحديث عدد البحثات في قاعدة البيانات
      if (user.id) {
        await updateUserSearches(user.id, newCount);
      }
      
      toast({
        title: "تم بنجاح",
        description: "تم إضافة البلوك الجديد وحصلت على 5 بحثات إضافية"
      });
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
            <div className="text-center">
              <span className="text-sm text-muted-foreground">مرحباً، {user.username}</span>
              <div className="text-xs text-primary font-medium">
                البحثات المتبقية: {remainingSearches}
              </div>
            </div>
            <Button onClick={onLogout} variant="outline" size="sm">
              تسجيل الخروج
            </Button>
          </div>
        </div>

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
                disabled={searchId.length !== 12 || remainingSearches <= 0 || isLoading}
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

        {/* إضافة بلوك جديد */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  إضافة بلوك جديد
                </CardTitle>
                <CardDescription>
                  إضافة رقم تعريفي جديد إلى قائمة المحظورين (يمنحك 5 بحثات إضافية)
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
                  disabled={!newBlock.id || !newBlock.name || !newBlock.reason || isLoading}
                >
                  {isLoading ? "جارٍ الإضافة..." : "إضافة البلوك (+5 بحثات)"}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;