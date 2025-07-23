import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, BookOpen, HelpCircle, Download } from "lucide-react";

const GuidesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">دليل الاستخدام والإرشادات</h1>
          <p className="text-muted-foreground">
            تعلم كيفية استخدام نظام إدارة تأجير السيارات بفعالية
          </p>
        </div>

        {/* Video Tutorial Section */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-6 w-6 text-primary" />
              الفيديو التعليمي
            </CardTitle>
            <CardDescription>
              شرح شامل لجميع مميزات النظام خطوة بخطوة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              {/* Video Placeholder */}
              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                <div className="text-center">
                  <PlayCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">شرح شامل لنظام إدارة السيارات</h3>
                  <p className="text-muted-foreground mb-4">مدة الفيديو: 15 دقيقة</p>
                  <Button className="bg-gradient-to-r from-primary to-primary-glow">
                    تشغيل الفيديو
                  </Button>
                </div>
              </div>
              
              {/* Video Controls Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    تحميل
                  </Button>
                </div>
                <span className="text-sm bg-black/50 px-2 py-1 rounded">
                  جودة عالية • 1080p
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              دليل البدء السريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-primary">للمديرين:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                    إنشاء حسابات المستخدمين وتحديد حدود البحث
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                    إضافة المستخدمين المحظورين مع أسباب الحظر
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                    مراقبة نشاط الحسابات والبحثات
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
                    إدارة إعدادات النظام وكلمات المرور
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-primary">للمستخدمين:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                    تسجيل الدخول باستخدام بيانات الحساب
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                    البحث عن المستخدمين المحظورين بالرقم التعريفي
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                    مراقبة عدد البحثات المتبقية
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
                    التواصل مع المدير عبر الدعم المباشر
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              الأسئلة الشائعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">كيف يمكنني البحث عن مستخدم محظور؟</h4>
                <p className="text-sm text-muted-foreground">
                  أدخل الرقم التعريفي المكون من 12 رقم في خانة البحث واضغط على زر "بحث". ستظهر لك النتيجة فوراً.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">ماذا أفعل إذا انتهت البحثات المتاحة؟</h4>
                <p className="text-sm text-muted-foreground">
                  تواصل مع المدير عبر الدعم المباشر لطلب زيادة عدد البحثات المتاحة لحسابك.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">كيف يمكنني تغيير كلمة المرور؟</h4>
                <p className="text-sm text-muted-foreground">
                  المديرون يمكنهم تغيير كلمات المرور من صفحة إعدادات المدير. المستخدمون يجب عليهم التواصل مع المدير.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">هل يمكنني استخدام النظام على الهاتف؟</h4>
                <p className="text-sm text-muted-foreground">
                  نعم، النظام متوافق مع جميع الأجهزة ويعمل بشكل مثالي على الهواتف والأجهزة اللوحية.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Contact */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="text-center p-6">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">تحتاج مساعدة إضافية؟</h3>
            <p className="text-muted-foreground mb-4">
              فريق الدعم متاح لمساعدتك في أي وقت
            </p>
            <Button className="bg-gradient-to-r from-primary to-primary-glow">
              تواصل مع الدعم
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuidesPage;