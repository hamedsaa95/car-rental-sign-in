import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";
import { useToast } from "@/hooks/use-toast";


interface User {
  id?: string;
  username: string;
  userType: 'admin' | 'user';
  searchLimit?: number;
  remainingSearches?: number;
}

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const { toast } = useToast();

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

    setIsLoading(true);
    
    try {
      // البحث عن المستخدم في localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.username === formData.username && u.password === formData.password);
      
      if (!user) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${user.user_type === 'admin' ? 'في نظام الإدارة' : 'في النظام'}`
      });
      
      onLogin({
        id: user.id || Date.now().toString(),
        username: user.username,
        userType: user.user_type,
        searchLimit: user.search_limit || 5,
        remainingSearches: user.remaining_searches || 5
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="flex justify-center mb-8">
          <CarRentalLogo size="lg" />
        </div>

        {/* نموذج تسجيل الدخول */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              ادخل بياناتك للوصول إلى نظام تأجير السيارات
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
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
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

              {/* زر تسجيل الدخول */}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-medium py-3 shadow-glow transition-all duration-300 hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>

              {/* رابط نسيت كلمة المرور */}
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary-glow transition-colors underline"
                >
                  نسيت كلمة المرور؟
                </button>
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