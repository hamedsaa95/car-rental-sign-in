import { supabase } from './supabase';

export const initializeData = async () => {
  try {
    // التحقق من وجود المدير
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();

    // إنشاء المدير إذا لم يكن موجوداً
    if (!adminUser) {
      const { error } = await supabase
        .from('users')
        .insert([
          {
            username: 'admin',
            password: '5971',
            user_type: 'admin'
          }
        ]);

      if (error) {
        console.error('Error creating admin user:', error);
      } else {
        console.log('Admin user created successfully');
      }
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};