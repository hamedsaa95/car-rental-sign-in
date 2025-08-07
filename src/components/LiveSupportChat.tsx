import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, X, Send, Bot, User, Clock, AlertCircle } from 'lucide-react';
import { useSupportChat, SupportMessage } from '@/hooks/useSupportChat';
import { useAuth } from '@/hooks/useAuth';
import { Textarea } from '@/components/ui/textarea';

interface LiveSupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveSupportChat: React.FC<LiveSupportChatProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    messages, 
    isLoading, 
    isConnected, 
    sendMessage,
    updateMessageStatus 
  } = useSupportChat(
    user?.username || 'unknown',
    user?.username || 'ضيف',
    user?.user_type === 'admin' ? 'admin' : 'user'
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    await sendMessage(message, priority);
    setMessage('');
    setPriority('normal');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'bot':
        return <Bot className="h-4 w-4" />;
      case 'admin':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'مرتفع';
      case 'normal': return 'عادي';
      case 'low': return 'منخفض';
      default: return 'عادي';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg w-full max-w-md h-[600px] flex flex-col shadow-xl m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-medium">الدعم المباشر</h3>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? 'متصل' : 'غير متصل'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4" dir="rtl">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد رسائل بعد</p>
              <p className="text-sm">ابدأ محادثة جديدة!</p>
            </div>
          ) : (
            messages.map((msg: SupportMessage) => (
              <div key={msg.id} className={`flex ${msg.message_type === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`rounded-lg p-3 max-w-[85%] ${
                  msg.message_type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : msg.message_type === 'bot'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getMessageIcon(msg.message_type)}
                    <span className="text-xs font-medium">
                      {msg.message_type === 'user' ? 'أنت' : 
                       msg.message_type === 'bot' ? 'المساعد الذكي' : 
                       msg.user_name}
                    </span>
                    {msg.priority !== 'normal' && (
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(msg.priority)}`} 
                           title={getPriorityLabel(msg.priority)} />
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-75">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.status === 'unread' && msg.message_type !== 'user' && (
                      <Badge variant="secondary" className="text-xs">
                        جديد
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex gap-2">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">منخفض</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="high">مرتفع</SelectItem>
                <SelectItem value="urgent">عاجل</SelectItem>
              </SelectContent>
            </Select>
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)} self-center`} />
          </div>
          
          <div className="flex gap-2">
            <Textarea
              placeholder="اكتب رسالتك..."
              className="flex-1 min-h-[40px] max-h-[100px] resize-none"
              dir="rtl"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="self-end"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            اضغط Enter للإرسال • Shift+Enter لسطر جديد
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveSupportChat;