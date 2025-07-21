import { useState, useEffect } from 'react'
import { supabase, User, BlockedUser } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useSupabase = () => {
  const { toast } = useToast()

  // تسجيل الدخول
  const login = async (username: string, password: string) => {
    try {
      // إضافة timeout للطلب
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 10000)
      );

      const loginPromise = supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) throw error
      
      return data
    } catch (error: any) {
      if (error.message === 'انتهت مهلة الاتصال') {
        throw new Error('انتهت مهلة الاتصال. تأكد من الاتصال بالإنترنت')
      }
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة')
    }
  }

  // إنشاء مستخدم جديد
  const createUser = async (userData: Omit<User, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب ${userData.username}`
      })

      return data
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message,
        variant: "destructive"
      })
      throw error
    }
  }

  // البحث عن مستخدم محظور
  const searchBlockedUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      return data
    } catch (error) {
      return null
    }
  }

  // إضافة مستخدم محظور
  const addBlockedUser = async (blockedUserData: Omit<BlockedUser, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .insert([blockedUserData])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "تم إضافة البلوك بنجاح",
        description: `تم حظر المستخدم ${blockedUserData.user_id}`
      })

      return data
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة البلوك",
        description: error.message,
        variant: "destructive"
      })
      throw error
    }
  }

  // الحصول على جميع المستخدمين المحظورين
  const getBlockedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      return data || []
    } catch (error) {
      return []
    }
  }

  // الحصول على جميع المستخدمين
  const getUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      return data || []
    } catch (error) {
      return []
    }
  }

  // تحديث عدد البحثات المتبقية للمستخدم
  const updateUserSearches = async (userId: string, remainingSearches: number) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ remaining_searches: remainingSearches })
        .eq('id', userId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating user searches:', error)
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