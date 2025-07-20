import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";
import { useToast } from "@/hooks/use-toast";

interface User {
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
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const { toast } = useToast();

  // قاعدة بيانات المستخدمين المؤقتة
  const [users] = useState<(User & { password: string })[]>([
    { 
      username: "admin", 
      password: "5971", 
      userType: "admin"
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // البحث عن المستخدم في قاعدة البيانات
    const user = users.find(u => 
      u.username === formData.username && 
      u.password === formData.password
    );

    if (user) {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${user.userType === 'admin' ? 'في نظام الإدارة' : 'في النظام'}`
      });
      
      const { password, ...userWithoutPassword } = user;
      onLogin(userWithoutPassword);
    } else {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive"
      });
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
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-medium py-3 shadow-glow transition-all duration-300 hover:shadow-lg"
              >
                تسجيل الدخول
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