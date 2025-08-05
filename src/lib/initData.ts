export const initializeData = () => {
  try {
    // إنشاء بيانات المدير في localStorage إذا لم تكن موجودة
    const existingUsers = localStorage.getItem('users');
    
    if (!existingUsers) {
      const defaultUsers = [
        {
          username: 'admin',
          password: '5971',
          user_type: 'admin'
        }
      ];
      
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      console.log('Admin user created successfully in localStorage');
    }

    // تهيئة البيانات الأخرى
    if (!localStorage.getItem('blocked_ids')) {
      localStorage.setItem('blocked_ids', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('messages')) {
      localStorage.setItem('messages', JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};