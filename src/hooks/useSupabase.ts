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
    try {
      if (username === 'admin') {
        // استخدام دالة التحقق المبسطة للمدير
        const { data: adminResult, error: adminError } = await (supabase as any)
          .rpc('authenticate_admin_simple', {
            username_input: username,
            password_input: password
          });

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
        // استخدام دالة التحقق المبسطة للمستخدمين العاديين
        const { data: userResult, error: userError } = await (supabase as any)
          .rpc('authenticate_user_simple', {
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
      // التحقق من عدم وجود اسم المستخدم
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', userData.username)
        .limit(1);

      if (checkError) {
        console.error('Error checking username:', checkError);
      } else if (existingUser && existingUser.length > 0) {
        throw new Error('اسم المستخدم موجود بالفعل');
      }

  // إنشاء المستخدم في قاعدة البيانات مع القيم الافتراضية الجديدة
      const userDataWithDefaults = {
        ...userData,
        search_limit: userData.search_limit || 1000,
        remaining_searches: userData.remaining_searches || 1000
      };

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([userDataWithDefaults])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

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
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error searching blocked user:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error searching blocked user:', error);
      return null;
    }
  }

  // إضافة مستخدم محظور
  const addBlockedUser = async (blockedUserData: Omit<BlockedUser, 'id' | 'created_at'>, addedBy?: string) => {
    try {
      const dataToInsert = {
        ...blockedUserData,
        created_by: addedBy || 'unknown'
      };

      // إضافة المستخدم المحظور إلى قاعدة البيانات
      const { data: newBlocked, error } = await supabase
        .from('blocked_users')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
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
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
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
      const { data: result, error } = await (supabase as any)
        .rpc('update_admin_credentials', {
          current_username: currentUsername,
          current_password: currentPassword,
          new_username: newUsername,
          new_password: newPassword
        });
      
      if (error || !result || !(result as any).success) {
        throw new Error((result as any)?.error || 'فشل في تحديث بيانات المدير');
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