
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ThankYouPageProps {
  signerName?: string;
  onGoHome?: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  signerName,
  onGoHome
}) => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            {t('thankYou.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {t('thankYou.documentSigned')}
            </p>
            {signerName && (
              <p className="text-muted-foreground">
                {t('thankYou.thankYouName').replace('{name}', signerName)}
              </p>
            )}
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              {t('thankYou.appreciation')}
            </p>
          </div>
          
          <div className="pt-4">
            {onGoHome ? (
              <Button 
                onClick={onGoHome}
                className="w-full flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                {t('thankYou.returnHome')}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('thankYou.closeWindow')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
