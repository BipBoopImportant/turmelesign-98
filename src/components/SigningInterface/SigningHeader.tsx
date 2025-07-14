import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Send } from 'lucide-react';

interface SigningHeaderProps {
  signerInfo: { name: string; email: string } | null;
  completedFields: number;
  totalFields: number;
  requiredFields: number;
  onDecline: () => void;
  onComplete: () => void;
}

export const SigningHeader: React.FC<SigningHeaderProps> = ({
  signerInfo,
  completedFields,
  totalFields,
  requiredFields,
  onDecline,
  onComplete
}) => {
  const { t } = useLanguage();
  const progressPercentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  return (
    <div className="border-b p-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('signing.signDocument')}</h1>
            <p className="text-muted-foreground">
              {signerInfo?.name} ({signerInfo?.email})
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{completedFields}/{totalFields}</span>
              </div>
              {requiredFields > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {requiredFields} {t('signing.requiredRemaining')}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={onDecline}
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              {t('signing.declineToSign')}
            </Button>
            
            <Button 
              onClick={onComplete}
              disabled={requiredFields > 0}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {t('signing.completeSigning')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};