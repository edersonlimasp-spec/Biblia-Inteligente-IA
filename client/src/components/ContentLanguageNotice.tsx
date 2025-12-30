import { AlertTriangle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContentLanguageNoticeProps {
  onViewInPortuguese?: () => void;
  showingFallback?: boolean;
}

export function ContentLanguageNotice({ 
  onViewInPortuguese,
  showingFallback = false
}: ContentLanguageNoticeProps) {
  const { language, t } = useLanguage();
  
  if (language === 'pt') return null;
  
  if (showingFallback) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
        <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
          <Globe className="w-3 h-3 mr-1" />
          PT
        </Badge>
        <span className="text-xs text-amber-600">{t("courses.showingFallback")}</span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4">
      <div className="flex items-center gap-2 text-amber-600">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium text-sm">{t("courses.contentInPortuguese")}</span>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        {t("courses.contentNotAvailable")}
      </p>
      {onViewInPortuguese && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewInPortuguese}
          className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          data-testid="button-view-portuguese"
        >
          <Globe className="w-4 h-4 mr-1" />
          {t("courses.viewInPortuguese")}
        </Button>
      )}
    </div>
  );
}
