import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";

interface AdminSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSettingsDialog = ({ isOpen, onClose }: AdminSettingsDialogProps) => {
  const [credentials, setCredentials] = useState({
    currentUsername: "",
    currentPassword: "",
    newUsername: "",
    newPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { updateAdminCredentials } = useSupabase();

  const handleSubmit = async () => {
    if (!credentials.currentUsername.trim() || !credentials.currentPassword.trim() || 
        !credentials.newUsername.trim() || !credentials.newPassword.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    if (credentials.newUsername.length < 3) {
      toast({
        title: "خطأ",
        description: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    if (credentials.newPassword.length < 4) {
      toast({
        title: "خطأ", 
        description: "كلمة المرور يجب أن تكون 4 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateAdminCredentials(
        credentials.currentUsername,
        credentials.currentPassword,
        credentials.newUsername,
        credentials.newPassword
      );
      
      setCredentials({
        currentUsername: "",
        currentPassword: "",
        newUsername: "",
        newPassword: ""
      });
      onClose();
    } catch (error) {
      // الخطأ يتم التعامل معه في useSupabase
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إعدادات المدير</DialogTitle>
          <DialogDescription>
            تغيير اسم المستخدم وكلمة المرور الخاصة بالمدير
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentUsername">اسم المستخدم الحالي</Label>
            <Input
              id="currentUsername"
              type="text"
              placeholder="ادخل اسم المستخدم الحالي"
              value={credentials.currentUsername}
              onChange={(e) => setCredentials(prev => ({ ...prev, currentUsername: e.target.value }))}
              className="text-right"
            />
          </div>

          <div>
            <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="ادخل كلمة المرور الحالية"
              value={credentials.currentPassword}
              onChange={(e) => setCredentials(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="text-right"
            />
          </div>

          <div>
            <Label htmlFor="newUsername">اسم المستخدم الجديد</Label>
            <Input
              id="newUsername"
              type="text"
              placeholder="ادخل اسم المستخدم الجديد"
              value={credentials.newUsername}
              onChange={(e) => setCredentials(prev => ({ ...prev, newUsername: e.target.value }))}
              className="text-right"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="ادخل كلمة المرور الجديدة"
              value={credentials.newPassword}
              onChange={(e) => setCredentials(prev => ({ ...prev, newPassword: e.target.value }))}
              className="text-right"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
              disabled={isLoading}
            >
              {isLoading ? "جاري التحديث..." : "تحديث البيانات"}
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSettingsDialog;