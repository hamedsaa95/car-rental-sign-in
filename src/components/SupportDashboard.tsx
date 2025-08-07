import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MessageCircle, Clock, User, Bot, AlertCircle, CheckCircle, X, Reply, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { SupportMessage, ChatSession } from '@/hooks/useSupportChat';

const SupportDashboard: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // تحميل الرسائل
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages((data || []) as SupportMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل",
        variant: "destructive",
      });
    }
  };

  // تحميل جلسات الدردشة
  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setChatSessions((data || []) as ChatSession[]);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  // تحديث حالة الرسالة
  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) throw error;
      await loadMessages();
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الرسالة بنجاح",
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الرسالة",
        variant: "destructive",
      });
    }
  };

  // إرسال رد
  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: selectedMessage.user_id,
          user_name: 'المدير',
          user_type: 'admin',
          message: replyText.trim(),
          message_type: 'admin',
          priority: selectedMessage.priority
        });

      if (error) throw error;

      // تحديث حالة الرسالة الأصلية إلى "تم الرد"
      await updateMessageStatus(selectedMessage.id, 'replied');
      
      setReplyText('');
      setSelectedMessage(null);
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرد بنجاح",
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // فلترة الرسائل
  const filteredMessages = messages.filter(msg => {
    if (filterStatus !== 'all' && msg.status !== filterStatus) return false;
    if (filterPriority !== 'all' && msg.priority !== filterPriority) return false;
    return true;
  });

  // إحصائيات
  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    urgent: messages.filter(m => m.priority === 'urgent').length,
    activeSessions: chatSessions.filter(s => s.session_status === 'active').length
  };

  useEffect(() => {
    loadMessages();
    loadChatSessions();

    // الاستماع للتحديثات في الوقت الفعلي
    const messagesChannel = supabase
      .channel('admin-support-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        loadMessages();
      })
      .subscribe();

    const sessionsChannel = supabase
      .channel('admin-chat-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_chat_sessions' }, () => {
        loadChatSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-500';
      case 'read': return 'bg-yellow-500';
      case 'replied': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">لوحة إدارة الدعم</h2>
        <Button onClick={loadMessages} variant="outline">
          تحديث
        </Button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">غير مقروءة</p>
                <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">عاجلة</p>
                <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">جلسات نشطة</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر */}
      <Card>
        <CardHeader>
          <CardTitle>فلترة الرسائل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="unread">غير مقروءة</SelectItem>
                <SelectItem value="read">مقروءة</SelectItem>
                <SelectItem value="replied">تم الرد</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="urgent">عاجل</SelectItem>
                <SelectItem value="high">مرتفع</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* الرسائل */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>الرسائل ({filteredMessages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {message.message_type === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span className="font-medium">{message.user_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {message.user_type === 'admin' ? 'مدير' : 'مستخدم'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(message.priority)}`} />
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(message.status)}`} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {message.message}
                    </p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{formatTime(message.created_at)}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.status === 'unread' ? 'غير مقروءة' :
                         message.status === 'read' ? 'مقروءة' : 'تم الرد'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredMessages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد رسائل</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تفاصيل الرسالة والرد */}
        <div>
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  تفاصيل الرسالة
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMessage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">المرسل:</p>
                  <p className="text-sm text-muted-foreground">{selectedMessage.user_name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">الرسالة:</p>
                  <p className="text-sm p-3 bg-muted rounded-lg">
                    {selectedMessage.message}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">الأولوية:</p>
                    <Badge className={getPriorityColor(selectedMessage.priority)}>
                      {selectedMessage.priority === 'urgent' ? 'عاجل' :
                       selectedMessage.priority === 'high' ? 'مرتفع' :
                       selectedMessage.priority === 'normal' ? 'عادي' : 'منخفض'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">الحالة:</p>
                    <Badge className={getStatusColor(selectedMessage.status)}>
                      {selectedMessage.status === 'unread' ? 'غير مقروءة' :
                       selectedMessage.status === 'read' ? 'مقروءة' : 'تم الرد'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">تحديث الحالة:</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      مقروءة
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMessageStatus(selectedMessage.id, 'replied')}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      تم الرد
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">إرسال رد:</p>
                  <textarea
                    className="w-full p-2 border rounded-md resize-none h-24"
                    placeholder="اكتب ردك هنا..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button
                    onClick={sendReply}
                    disabled={!replyText.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    إرسال الرد
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>اختر رسالة لعرض التفاصيل</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;