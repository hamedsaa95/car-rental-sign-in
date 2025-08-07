import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupportMessage {
  user_id: string;
  user_name: string;
  user_type: string;
  message: string;
  message_type?: string;
  priority?: string;
}

interface AutoResponse {
  message: string;
  type: 'greeting' | 'help' | 'escalation' | 'closure';
}

const autoResponses: Record<string, AutoResponse> = {
  greeting: {
    message: "مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟",
    type: 'greeting'
  },
  help: {
    message: "يمكنني مساعدتك في:\n• الاستفسارات العامة\n• مشاكل تقنية\n• معلومات حول الخدمات\n\nاكتب سؤالك وسأرد عليك فوراً!",
    type: 'help'
  },
  escalation: {
    message: "شكراً لك على رسالتك. تم تحويل استفسارك إلى فريق الدعم المتخصص. ستتلقى رداً في أقرب وقت ممكن.",
    type: 'escalation'
  },
  closure: {
    message: "شكراً لاستخدام خدمة الدعم. إذا كان لديك أي استفسارات أخرى، لا تتردد في التواصل معنا.",
    type: 'closure'
  }
};

const generateAutoResponse = (message: string): AutoResponse => {
  const lowerMessage = message.toLowerCase();
  
  // مرحبا / سلام
  if (lowerMessage.includes('مرحبا') || lowerMessage.includes('السلام') || lowerMessage.includes('أهلا')) {
    return autoResponses.greeting;
  }
  
  // مساعدة
  if (lowerMessage.includes('مساعدة') || lowerMessage.includes('help') || lowerMessage.includes('ساعد')) {
    return autoResponses.help;
  }
  
  // مشكلة تقنية أو استفسار معقد
  if (lowerMessage.includes('مشكلة') || lowerMessage.includes('خطأ') || lowerMessage.includes('لا يعمل')) {
    return autoResponses.escalation;
  }
  
  // رسالة افتراضية
  return {
    message: "شكراً لك على رسالتك. سيتم الرد عليك قريباً من قبل فريق الدعم.",
    type: 'escalation'
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...data }: { action: string } & SupportMessage = await req.json();

    if (action === 'send_message') {
      console.log('Processing support message:', data);

      // إدراج الرسالة في قاعدة البيانات
      const { data: messageData, error: messageError } = await supabase
        .from('support_messages')
        .insert({
          user_id: data.user_id,
          user_name: data.user_name,
          user_type: data.user_type,
          message: data.message,
          message_type: data.message_type || 'user',
          priority: data.priority || 'normal'
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error inserting message:', messageError);
        throw messageError;
      }

      // إنتاج رد تلقائي من البوت
      const autoResponse = generateAutoResponse(data.message);
      
      // إدراج الرد التلقائي
      const { error: botError } = await supabase
        .from('support_messages')
        .insert({
          user_id: data.user_id,
          user_name: 'نظام الدعم الآلي',
          user_type: 'admin',
          message: autoResponse.message,
          message_type: 'bot',
          priority: 'normal'
        });

      if (botError) {
        console.error('Error inserting bot response:', botError);
      }

      // إنشاء جلسة دردشة إذا لم تكن موجودة
      const { data: existingSession } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .eq('user_id', data.user_id)
        .eq('session_status', 'active')
        .single();

      if (!existingSession) {
        await supabase
          .from('support_chat_sessions')
          .insert({
            user_id: data.user_id,
            user_name: data.user_name,
            session_status: 'active'
          });
      } else {
        // تحديث آخر نشاط
        await supabase
          .from('support_chat_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', existingSession.id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: messageData,
        autoResponse: autoResponse
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_messages') {
      const { user_id } = data as { user_id: string };
      
      const { data: messages, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ success: true, messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_status') {
      const { message_id, status } = data as { message_id: string; status: string };
      
      const { error } = await supabase
        .from('support_messages')
        .update({ status })
        .eq('id', message_id);

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in support-notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});