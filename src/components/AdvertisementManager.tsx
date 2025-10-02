import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Eye, EyeOff, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Advertisement {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

interface AdvertisementManagerProps {
  username: string;
}

const AdvertisementManager = ({ username }: AdvertisementManagerProps) => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    image_url: ""
  });
  const { toast } = useToast();

  const fetchAdvertisements = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_all_advertisements_admin');

      if (error) throw error;
      setAdvertisements(data || []);
    } catch (error) {
      console.error('خطأ في جلب الإعلانات:', error);
    }
  };

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.image_url.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('add_advertisement_secure', {
          title_input: formData.title,
          image_url_input: formData.image_url,
          created_by_input: username,
        });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'فشل في إضافة الإعلان');
      }

      toast({
        title: "تم الإضافة بنجاح",
        description: "تم إضافة الإعلان الجديد"
      });

      setFormData({ title: "", image_url: "" });
      setIsOpen(false);
      fetchAdvertisements();
    } catch (error: any) {
      toast({
        title: "خطأ في الإضافة",
        description: error.message || "حدث خطأ أثناء إضافة الإعلان",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .rpc('toggle_advertisement_secure', {
          ad_id_input: id,
          is_active_input: !currentStatus,
        });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'فشل في تحديث حالة الإعلان');
      }

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} الإعلان`
      });

      fetchAdvertisements();
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث حالة الإعلان",
        variant: "destructive"
      });
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

    try {
      const { data, error } = await supabase
        .rpc('delete_advertisement_secure', {
          ad_id_input: id,
        });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'فشل في حذف الإعلان');
      }

      toast({
        title: "تم الحذف",
        description: "تم حذف الإعلان بنجاح"
      });

      fetchAdvertisements();
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف الإعلان",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              إدارة الإعلانات
            </CardTitle>
            <CardDescription>
              إضافة وإدارة الإعلانات التي تظهر للمستخدمين
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="h-4 w-4 ml-2" />
                إضافة إعلان
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-right">إضافة إعلان جديد</DialogTitle>
                <DialogDescription className="text-right">
                  أضف صورة إعلانية جديدة لعرضها للمستخدمين
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-right">
                    عنوان الإعلان
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="ادخل عنوان الإعلان"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="text-right"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url" className="text-right">
                    رابط الصورة
                  </Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="text-right"
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
                    {isLoading ? "جارٍ الإضافة..." : "إضافة الإعلان"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {advertisements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد إعلانات حالياً
            </p>
          ) : (
            advertisements.map((ad) => (
              <div key={ad.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <img 
                  src={ad.image_url} 
                  alt={ad.title}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{ad.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {ad.is_active ? 'نشط' : 'غير نشط'} • {new Date(ad.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                  >
                    {ad.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteAd(ad.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvertisementManager;