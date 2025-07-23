import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Settings, BookOpen, MessageCircle, X } from "lucide-react";
import CarRentalLogo from "./CarRentalLogo";

interface NavigationBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userType: 'admin' | 'user';
}

const NavigationBar = ({ currentPage, onNavigate, onLogout, userType }: NavigationBarProps) => {
  const [showSupportChat, setShowSupportChat] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'الصفحة الرئيسية', icon: Home },
    ...(userType === 'admin' ? [
      { id: 'admin-settings', label: 'إعدادات المدير', icon: Settings }
    ] : []),
    { id: 'guides', label: 'الإرشادات', icon: BookOpen },
  ];

  return (
    <>
      <nav className="bg-card/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <CarRentalLogo size="sm" />

            {/* Navigation Links */}
            <div className="flex items-center space-x-8 rtl:space-x-reverse">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => onNavigate(item.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>

            {/* Support Chat & Logout */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSupportChat(true)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                الدعم المباشر
                <Badge variant="secondary" className="text-xs">
                  متاح
                </Badge>
              </Button>
              
              <Button 
                onClick={onLogout} 
                variant="outline" 
                size="sm"
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </nav>

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