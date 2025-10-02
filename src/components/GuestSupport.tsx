import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Phone, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Input validation schema
const guestSupportSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "الاسم مطلوب" })
    .max(100, { message: "الاسم يجب أن يكون أقل من 100 حرف" }),
  email: z.string()
    .trim()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .max(255, { message: "البريد الإلكتروني طويل جداً" }),
  phone: z.string()
    .trim()
    .max(20, { message: "رقم الهاتف طويل جداً" })
    .optional()
    .or(z.literal("")),
  message: z.string()
    .trim()
    .min(1, { message: "الرسالة مطلوبة" })
    .max(2000, { message: "الرسالة يجب أن تكون أقل من 2000 حرف" })
});

const GuestSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input data
    const validationResult = guestSupportSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "خطأ في البيانات",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use validated data
      const sanitizedData = {
        name: validationResult.data.name,
        email: validationResult.data.email.toLowerCase(),
        phone: validationResult.data.phone || null,
        message: validationResult.data.message
      };

      const { error } = await supabase
        .from('guest_support_messages')
        .insert([sanitizedData]);

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال رسالتك وسيتم الرد عليك قريباً"
      });

      setFormData({ name: "", email: "", phone: "", message: "" });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 bg-background/50 hover:bg-background/80"
        >
          <MessageCircle className="h-4 w-4" />
          تواصل مع الدعم
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تواصل مع الدعم</DialogTitle>
          <DialogDescription className="text-right">
            يمكنك التواصل معنا قبل تسجيل الدخول لأي استفسار
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right flex items-center gap-2">
              <User className="h-4 w-4" />
              الاسم *
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="ادخل اسمك الكامل"
              value={formData.name}
              onChange={handleInputChange}
              className="text-right"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-right flex items-center gap-2">
              <Mail className="h-4 w-4" />
              البريد الإلكتروني *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ادخل بريدك الإلكتروني"
              value={formData.email}
              onChange={handleInputChange}
              className="text-right"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-right flex items-center gap-2">
              <Phone className="h-4 w-4" />
              رقم الهاتف (اختياري)
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="ادخل رقم هاتفك"
              value={formData.phone}
              onChange={handleInputChange}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-right">
              الرسالة *
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="اكتب رسالتك هنا..."
              value={formData.message}
              onChange={handleInputChange}
              className="text-right min-h-[100px]"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
            >
              {isLoading ? "جارٍ الإرسال..." : "إرسال الرسالة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuestSupport;