import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";

interface NewsTickerBarProps {
  onDataUpdate?: () => void;
}

const NewsTickerBar = ({ onDataUpdate }: NewsTickerBarProps) => {
  const [recentBlocks, setRecentBlocks] = useState<any[]>([]);
  const { getBlockedUsers } = useSupabase();

  useEffect(() => {
    loadRecentBlocks();
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(loadRecentBlocks, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRecentBlocks = async () => {
    try {
      const blockedUsers = await getBlockedUsers();
      // ترتيب حسب التاريخ وأخذ آخر 10
      const sorted = blockedUsers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      setRecentBlocks(sorted);
      onDataUpdate?.();
    } catch (error) {
      console.error('Error loading recent blocks:', error);
    }
  };

  if (recentBlocks.length === 0) return null;

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 overflow-hidden relative">
      <div className="py-2 px-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-destructive whitespace-nowrap">
            آخر الحظر:
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-scroll-right flex gap-8 whitespace-nowrap">
              {recentBlocks.map((user, index) => (
                <span key={user.id || index} className="text-sm text-muted-foreground">
                  {index + 1}. {user.name}
                </span>
              ))}
              {/* تكرار القائمة لضمان التمرير المستمر */}
              {recentBlocks.map((user, index) => (
                <span key={`duplicate-${user.id || index}`} className="text-sm text-muted-foreground">
                  {index + 1}. {user.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTickerBar;