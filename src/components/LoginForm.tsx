import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User as UserIcon, Phone, Building } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";
import GuestSupport from "./GuestSupport";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";
import type { User } from "../pages/Index";

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    companyName: ""
  });
  const { toast } = useToast();
  const { login, createUser } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    if (isRegisterMode) {
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "خطأ",
          description: "كلمتا المرور غير متطابقتان",
          variant: "destructive"
        });
        return;
      }
      
      if (formData.password.length < 4) {
        toast({
          title: "خطأ",
          description: "يجب أن تكون كلمة المرور 4 أحرف على الأقل",
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      if (isRegisterMode) {
        // تسجيل مستخدم جديد
        await createUser({
          username: formData.username,
          password: formData.password,
          user_type: 'user',
          search_limit: 1000,
          remaining_searches: 1000,
          phone_number: formData.phoneNumber,
          company_name: formData.companyName
        });
        
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "يمكنك الآن تسجيل الدخول بحسابك الجديد"
        });
        
        // العودة إلى وضع تسجيل الدخول
        setIsRegisterMode(false);
        setFormData({ username: formData.username, password: "", confirmPassword: "", phoneNumber: "", companyName: "" });
      } else {
        // تسجيل الدخول
        const user = await login(formData.username, formData.password);
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${user.user_type === 'admin' ? 'في نظام الإدارة' : 'في النظام'}`
        });
        
        onLogin({
          id: user.id,
          username: user.username,
          user_type: user.user_type as 'admin' | 'user',
          search_limit: user.search_limit,
          remaining_searches: user.remaining_searches
        });
      }
    } catch (error: any) {
      toast({
        title: isRegisterMode ? "خطأ في إنشاء الحساب" : "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setFormData({ username: "", password: "", confirmPassword: "", phoneNumber: "", companyName: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="flex justify-center mb-8">
          <CarRentalLogo size="lg" />
        </div>

        {/* دعم الضيوف */}
        <div className="flex justify-center mb-4">
          <GuestSupport />
        </div>

        {/* نموذج تسجيل الدخول */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              {isRegisterMode ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isRegisterMode ? "أنشئ حساباً جديداً للانضمام إلى النظام" : "ادخل بياناتك للوصول إلى نظام تأجير السيارات"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* حقل اسم المستخدم */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="ادخل اسم المستخدم"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pr-10 text-right bg-background/50 border-border focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              {/* حقل كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="ادخل كلمة المرور"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pr-10 pl-10 text-right bg-background/50 border-border focus:border-primary transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* حقل تأكيد كلمة المرور - يظهر فقط في وضع التسجيل */}
              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    تأكيد كلمة المرور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="أعد إدخال كلمة المرور"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pr-10 text-right bg-background/50 border-border focus:border-primary transition-colors"
                      required={isRegisterMode}
                    />
                  </div>
                </div>
              )}

              {/* حقول إضافية للتسجيل */}
              {isRegisterMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
                      رقم الهاتف *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder="ادخل رقم الهاتف"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="pr-10 text-right bg-background/50 border-border focus:border-primary transition-colors"
                        required={isRegisterMode}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                      اسم الشركة *
                    </Label>
                    <div className="relative">
                      <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="companyName"
                        name="companyName"
                        type="text"
                        placeholder="ادخل اسم الشركة"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="pr-10 text-right bg-background/50 border-border focus:border-primary transition-colors"
                        required={isRegisterMode}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* زر تسجيل الدخول */}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-medium py-3 shadow-glow transition-all duration-300 hover:shadow-lg disabled:opacity-50"
              >
                {isLoading 
                  ? (isRegisterMode ? "جارٍ إنشاء الحساب..." : "جارٍ تسجيل الدخول...") 
                  : (isRegisterMode ? "إنشاء الحساب" : "تسجيل الدخول")
                }
              </Button>

              {/* التبديل بين تسجيل الدخول وإنشاء حساب */}
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-primary hover:text-primary-glow transition-colors underline"
                >
                  {isRegisterMode ? "لديك حساب؟ سجل الدخول" : "لا تملك حساباً؟ أنشئ حساباً جديداً"}
                </button>
                
                {!isRegisterMode && (
                  <div>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* تذييل */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            © 2024 نظام تأجير السيارات. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;