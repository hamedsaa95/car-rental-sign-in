import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface SupportMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_type: string;
  message: string;
  message_type: 'user' | 'admin' | 'bot';
  status: 'unread' | 'read' | 'replied';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  user_name: string;
  session_status: 'active' | 'closed' | 'waiting';
  admin_id?: string;
  started_at: string;
  ended_at?: string;
  last_activity: string;
}

export const useSupportChat = (userId: string, userName: string, userType: 'admin' | 'user') => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // تحميل الرسائل
  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

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
  }, [userId, toast]);

  // إرسال رسالة
  const sendMessage = useCallback(async (message: string, priority: string = 'normal') => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('support-notification', {
        body: {
          action: 'send_message',
          user_id: userId,
          user_name: userName,
          user_type: userType,
          message: message.trim(),
          priority
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالتك بنجاح",
      });

      // إعادة تحميل الرسائل
      await loadMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, userName, userType, loadMessages, toast]);

  // تحديث حالة الرسالة
  const updateMessageStatus = useCallback(async (messageId: string, status: string) => {
    try {
      const response = await supabase.functions.invoke('support-notification', {
        body: {
          action: 'update_status',
          message_id: messageId,
          status
        }
      });

      if (response.error) throw response.error;
      await loadMessages();
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الرسالة",
        variant: "destructive",
      });
    }
  }, [loadMessages, toast]);

  // الاستماع للتحديثات في الوقت الفعلي
  useEffect(() => {
    loadMessages();

    // إعداد الاستماع للتحديثات في الوقت الفعلي
    const channel = supabase
      .channel('support-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${userId}`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadMessages]);

  return {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    updateMessageStatus,
    loadMessages
  };
};