import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Settings, BookOpen, MessageCircle, Menu } from "lucide-react";
import LiveSupportChat from "./LiveSupportChat";

interface NavigationBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userType: 'admin' | 'user';
}

const NavigationBar = ({ currentPage, onNavigate, onLogout, userType }: NavigationBarProps) => {
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
            {/* Left Side - Search Text */}
            <div className="text-sm font-medium text-foreground">
              البحث
            </div>

            {/* Center - Empty Space */}
            <div></div>

            {/* Right Side - Menu Button */}
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
        <div className="absolute top-14 right-4 bg-card rounded-lg shadow-lg border border-border z-50 min-w-[200px]">
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

      {/* Live Support Chat */}
      <LiveSupportChat 
        isOpen={showSupportChat}
        onClose={() => setShowSupportChat(false)}
      />
    </>
  );
};

export default NavigationBar;