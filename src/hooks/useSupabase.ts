import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface User {
  id?: string
  username: string
  password: string
  user_type: 'admin' | 'user'
  search_limit?: number
  remaining_searches?: number
  phone_number?: string
  company_name?: string
  created_at?: string
}

export interface BlockedUser {
  id?: string
  user_id: string
  name: string
  reason: string
  created_at?: string
  created_by?: string
}

export const useSupabase = () => {
  const { toast } = useToast()

  // تسجيل الدخول
  const login = async (username: string, password: string) => {
    console.log('Attempting login for:', username);
    try {
      if (username === 'admin') {
        // استخدام دالة التحقق الآمنة للمدير
        const { data: adminResult, error: adminError } = await (supabase as any)
          .rpc('authenticate_admin_secure', {
            username_input: username,
            password_input: password
          });
        
        console.log('Admin authentication result:', adminResult);
        
        if (!adminError && adminResult && (adminResult as any).success) {
          return {
            id: (adminResult as any).user_id,
            username: (adminResult as any).username,
            user_type: 'admin' as const,
            search_limit: null,
            remaining_searches: null
          };
        } else {
          throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
      } else {
        // استخدام دالة التحقق الآمنة للمستخدمين العاديين
        const { data: userResult, error: userError } = await (supabase as any)
          .rpc('authenticate_user_secure', {
            username_input: username,
            password_input: password
          });

        
        if (userError || !userResult || !userResult.success) {
          throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }

        return {
          id: userResult.id,
          username: userResult.username,
          user_type: userResult.user_type,
          search_limit: userResult.search_limit,
          remaining_searches: userResult.remaining_searches,
          phone_number: userResult.phone_number,
          company_name: userResult.company_name
        };
      }
    } catch (error: any) {
      throw new Error(error.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  }

  // إنشاء مستخدم جديد
  const createUser = async (userData: Omit<User, 'id' | 'created_at'>) => {
    try {
      // استخدام دالة آمنة لإنشاء المستخدم
      const { data: result, error } = await (supabase as any)
        .rpc('create_user_secure', {
          username_input: userData.username,
          password_input: userData.password,
          user_type_input: userData.user_type,
          search_limit_input: userData.search_limit || 1000,
          remaining_searches_input: userData.remaining_searches || 1000,
          phone_number_input: userData.phone_number || null,
          company_name_input: userData.company_name || null
        });

      if (error || !result || !result.success) {
        throw new Error(result?.error || 'فشل في إنشاء المستخدم');
      }

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب ${userData.username}`
      });

      return result.user;
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
      const { data: result, error } = await (supabase as any)
        .rpc('search_blocked_user_secure', {
          user_id_input: userId
        });

      if (error || !result || !result.success) {
        console.error('Error searching blocked user:', error);
        return null;
      }
      
      return result.blocked ? result.blocked_user : null;
    } catch (error) {
      console.error('Error searching blocked user:', error);
      return null;
    }
  }

  // إضافة مستخدم محظور
  const addBlockedUser = async (blockedUserData: Omit<BlockedUser, 'id' | 'created_at'>, addedBy?: string) => {
    try {
      // استخدام دالة آمنة لإضافة مستخدم محظور
      const { data: result, error } = await (supabase as any)
        .rpc('add_blocked_user_secure', {
          user_id_input: blockedUserData.user_id,
          name_input: blockedUserData.name,
          reason_input: blockedUserData.reason,
          created_by_input: addedBy || 'unknown'
        });

      if (error || !result || !result.success) {
        throw new Error(result?.error || 'فشل في إضافة المستخدم المحظور');
      }

      // تتبع نشاط الحسابات
      if (addedBy && addedBy !== 'admin') {
        await supabase
          .from('account_activity')
          .insert([{
            username: addedBy,
            action: 'added_block',
            blocked_user_id: blockedUserData.user_id
          }]);
      }

      toast({
        title: "تم إضافة البلوك بنجاح",
        description: `تم حظر المستخدم ${blockedUserData.user_id}`
      });

      return result.blocked_user;
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
      const { data, error } = await (supabase as any)
        .rpc('get_blocked_users_admin');

      if (error) {
        console.error('Error getting blocked users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }
  }

  // الحصول على جميع المستخدمين (للمدير فقط)
  const getUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_all_users_admin');

      if (error) {
        console.error('Error getting users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // تحديث عدد البحثات المتبقية للمستخدم
  const updateUserSearches = async (userId: string, remainingSearches: number) => {
    try {
      const { data: result, error } = await (supabase as any)
        .rpc('update_user_searches_admin', {
          user_id_input: userId,
          remaining_searches_input: remainingSearches
        });

      if (error || !result?.success) {
        console.error('Error updating user searches:', error);
      }
    } catch (error: any) {
      console.error('Error updating user searches:', error);
    }
  }

  // الحصول على نشاط الحسابات
  const getAccountActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('account_activity')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error getting account activity:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting account activity:', error);
      return [];
    }
  };

  // حذف مستخدم (للمدير فقط)
  const deleteUser = async (userId: string) => {
    try {
      const { data: result, error } = await (supabase as any)
        .rpc('delete_user_admin', {
          user_id_input: userId
        });

      if (error || !result?.success) {
        throw new Error(result?.error || 'فشل في حذف المستخدم');
      }
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المستخدم بنجاح"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  // حذف مستخدم محظور
  const deleteBlockedUser = async (userId: string) => {
    try {
      const { data: result, error } = await (supabase as any)
        .rpc('remove_blocked_user_secure', {
          user_id_input: userId
        });

      if (error || !result?.success) {
        throw new Error(result?.error || 'فشل في إلغاء الحظر');
      }
      
      toast({
        title: "تم إلغاء الحظر بنجاح",
        description: "تم إزالة المستخدم من قائمة المحظورين"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في إلغاء الحظر",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  // تغيير بيانات المدير
  const updateAdminCredentials = async (currentUsername: string, currentPassword: string, newUsername: string, newPassword: string) => {
    try {
      // التحقق من بيانات المدير الحالية أولاً
      const { data: verifyResult, error: verifyError } = await (supabase as any)
        .rpc('authenticate_admin_secure', {
          username_input: currentUsername,
          password_input: currentPassword
        });

      if (verifyError || !verifyResult || !(verifyResult as any).success) {
        throw new Error('بيانات المدير الحالية غير صحيحة');
      }

      // تحديث بيانات المدير باستخدام دالة آمنة
      const { data: updateResult, error: updateError } = await (supabase as any)
        .rpc('update_admin_credentials', {
          current_username: currentUsername,
          current_password: currentPassword,
          new_username: newUsername,
          new_password: newPassword
        });
      
      if (updateError || !updateResult?.success) {
        throw new Error(updateResult?.error || 'فشل في تحديث بيانات المدير');
      }
      
      toast({
        title: "تم تحديث بيانات المدير",
        description: "تم تغيير اسم المستخدم وكلمة المرور بنجاح"
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث بيانات المدير",
        variant: "destructive"
      });
      throw error;
    }
  }

  // الحصول على بيانات المدير الحالية (لا يُظهر كلمة المرور لأسباب أمنية)
  const getAdminCredentials = async () => {
    try {
      // لا نعرض كلمة المرور لأسباب أمنية
      // سيتم طلب كلمة المرور الحالية عند التحديث
      return { username: 'admin', password: '' };
    } catch (error) {
      return { username: 'admin', password: '' };
    }
  }

  return {
    login,
    createUser,
    searchBlockedUser,
    addBlockedUser,
    getBlockedUsers,
    getUsers,
    updateUserSearches,
    getAccountActivity,
    deleteUser,
    deleteBlockedUser,
    updateAdminCredentials,
    getAdminCredentials
  }
}