import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Settings, BookOpen, MessageCircle, X, Menu, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CarRentalLogo from "./CarRentalLogo";

interface NavigationBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userType: 'admin' | 'user';
}

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'admin';
  timestamp: Date;
}

const NavigationBar = ({ currentPage, onNavigate, onLogout, userType }: NavigationBarProps) => {
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      message: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
      sender: 'admin',
      timestamp: new Date(),
    }
  ]);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    // إضافة رسالة المستخدم
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      message: chatMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setChatMessage("");

    // إشعار نجاح الإرسال
    toast({
      title: "تم إرسال الرسالة",
      description: "تم إرسال رسالتك بنجاح إلى المدير",
    });

    // حفظ الرسالة في localStorage
    try {
      const savedMessages = JSON.parse(localStorage.getItem('support_messages') || '[]');
      const messageToSave = {
        ...newUserMessage,
        userId: localStorage.getItem('currentUser') || 'unknown',
        userType: userType
      };
      savedMessages.push(messageToSave);
      localStorage.setItem('support_messages', JSON.stringify(savedMessages));
    } catch (error) {
      console.error('خطأ في حفظ الرسالة:', error);
    }

    // محاكاة رد المدير التلقائي
    setTimeout(() => {
      const adminReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: 'شكراً لك على رسالتك. سيتم الرد عليك قريباً من قبل المدير.',
        sender: 'admin',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, adminReply]);
    }, 1500);
  };

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
            <div className="flex-1 p-4 overflow-y-auto" dir="rtl">
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`rounded-lg p-3 max-w-[80%] ${
                      msg.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <span className={`text-xs ${
                        msg.sender === 'user' ? 'opacity-80' : 'text-muted-foreground'
                      }`}>
                        {msg.sender === 'user' ? 'أنت' : 'المدير'} • {msg.timestamp.toLocaleTimeString('ar-SA', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اكتب رسالتك..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm bg-background"
                  dir="rtl"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  <Send className="h-4 w-4" />
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