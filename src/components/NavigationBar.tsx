import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Settings, BookOpen, MessageCircle, X, Menu } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";

interface NavigationBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userType: 'admin' | 'user';
}

const NavigationBar = ({ currentPage, onNavigate, onLogout, userType }: NavigationBarProps) => {
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [timer, setTimer] = useState({ minutes: 0, seconds: 33 });

  // Timer functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    { id: 'dashboard', label: 'الصفحة الرئيسية', icon: Home },
    ...(userType === 'admin' ? [
      { id: 'admin-settings', label: 'إعدادات المدير', icon: Settings }
    ] : []),
    { id: 'guides', label: 'الإرشادات', icon: BookOpen },
  ];

  return (
    <>
      <nav className="bg-secondary/10 backdrop-blur-sm border-b border-border/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            {/* Right Side - Search Text */}
            <div className="text-sm font-medium text-foreground">
              البحث
            </div>

            {/* Center - Timer */}
            <div className="bg-primary rounded-full px-4 py-1 text-primary-foreground text-sm font-medium">
              {timer.minutes}:{timer.seconds.toString().padStart(2, '0')}
            </div>

            {/* Left Side - Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute top-14 left-4 bg-card rounded-lg shadow-lg border border-border z-50 min-w-[200px]">
          <div className="p-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => {
                    onNavigate(item.id);
                    setShowMenu(false);
                  }}
                  className="w-full justify-start gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
            
            <div className="border-t border-border my-1"></div>
            
            <Button
              variant="ghost"
              onClick={() => {
                setShowSupportChat(true);
                setShowMenu(false);
              }}
              className="w-full justify-start gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              الدعم المباشر
              <Badge variant="secondary" className="text-xs ml-auto">
                متاح
              </Badge>
            </Button>
            
            <Button 
              onClick={() => {
                onLogout();
                setShowMenu(false);
              }}
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop for menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Support Chat Modal */}
      {showSupportChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg w-96 h-[500px] flex flex-col shadow-xl">
            {/* Chat Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="font-medium">الدعم المباشر</h3>
                <Badge variant="secondary" className="text-xs">
                  متصل
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSupportChat(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Admin Message */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">مرحباً! كيف يمكنني مساعدتك اليوم؟</p>
                    <span className="text-xs text-muted-foreground">المدير • الآن</span>
                  </div>
                </div>
                
                {/* User Message Example */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">أحتاج مساعدة في استخدام النظام</p>
                    <span className="text-xs opacity-80">أنت • منذ قليل</span>
                  </div>
                </div>

                {/* Admin Response */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">بالطبع! يمكنك مراجعة صفحة الإرشادات للحصول على فيديو تعليمي شامل، أو اخبرني بما تحتاج إليه تحديداً.</p>
                    <span className="text-xs text-muted-foreground">المدير • الآن</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اكتب رسالتك..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  dir="rtl"
                />
                <Button size="sm">
                  إرسال
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationBar;