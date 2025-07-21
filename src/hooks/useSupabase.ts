import { useState, useEffect } from 'react'
import { supabase, User, BlockedUser } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useSupabase = () => {
  const { toast } = useToast()

  // تسجيل الدخول
  const login = async (username: string, password: string) => {
    try {
      // التحقق المحلي أولاً للمدير
      if (username === 'admin' && password === '5971') {
        return {
          id: '1',
          username: 'admin',
          user_type: 'admin' as const,
          search_limit: null,
          remaining_searches: null
        };
      }

      // التحقق من المستخدمين المحليين
      const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      const localUser = existingUsers.find((u: any) => 
        u.username === username && u.password === password
      );

      if (localUser) {
        return localUser;
      }

      // إذا لم يوجد محلياً، جرب Supabase مع timeout قصير
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 3000)
      );

      const loginPromise = supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) throw error
      
      return data;
    } catch (error: any) {
      if (error.message === 'انتهت مهلة الاتصال') {
        throw new Error('لم يتم العثور على المستخدم');
      }
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  }

  // إنشاء مستخدم جديد
  const createUser = async (userData: Omit<User, 'id' | 'created_at'>) => {
    try {
      // حفظ محلي مؤقت
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        created_at: new Date().toISOString()
      };

      // محاكاة حفظ في localStorage
      const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      
      // التحقق من عدم وجود اسم المستخدم
      if (existingUsers.find((u: any) => u.username === userData.username)) {
        throw new Error('اسم المستخدم موجود بالفعل');
      }

      existingUsers.push(newUser);
      localStorage.setItem('app_users', JSON.stringify(existingUsers));

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب ${userData.username}`
      });

      return newUser;
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }

  // البحث عن مستخدم محظور
  const searchBlockedUser = async (userId: string) => {
    try {
      // البحث المحلي أولاً
      const existingBlocked = JSON.parse(localStorage.getItem('app_blocked') || '[]');
      const localBlocked = existingBlocked.find((u: any) => u.user_id === userId);
      
      if (localBlocked) {
        return localBlocked;
      }

      // جرب Supabase مع timeout قصير
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      return null;
    }
  }

  // إضافة مستخدم محظور
  const addBlockedUser = async (blockedUserData: Omit<BlockedUser, 'id' | 'created_at'>) => {
    try {
      // حفظ محلي
      const newBlocked = {
        id: Date.now().toString(),
        ...blockedUserData,
        created_at: new Date().toISOString()
      };

      const existingBlocked = JSON.parse(localStorage.getItem('app_blocked') || '[]');
      existingBlocked.push(newBlocked);
      localStorage.setItem('app_blocked', JSON.stringify(existingBlocked));

      toast({
        title: "تم إضافة البلوك بنجاح",
        description: `تم حظر المستخدم ${blockedUserData.user_id}`
      });

      return newBlocked;
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة البلوك",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }

  // الحصول على جميع المستخدمين المحظورين
  const getBlockedUsers = async () => {
    try {
      const localBlocked = JSON.parse(localStorage.getItem('app_blocked') || '[]');
      return localBlocked;
    } catch (error) {
      return [];
    }
  }

  // الحصول على جميع المستخدمين
  const getUsers = async () => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      return localUsers;
    } catch (error) {
      return [];
    }
  }

  // تحديث عدد البحثات المتبقية للمستخدم
  const updateUserSearches = async (userId: string, remainingSearches: number) => {
    try {
      // تحديث محلي
      const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      const updatedUsers = existingUsers.map((user: any) => 
        user.id === userId ? { ...user, remaining_searches: remainingSearches } : user
      );
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    } catch (error: any) {
      console.error('Error updating user searches:', error);
    }
  }

  return {
    login,
    createUser,
    searchBlockedUser,
    addBlockedUser,
    getBlockedUsers,
    getUsers,
    updateUserSearches
  }
}