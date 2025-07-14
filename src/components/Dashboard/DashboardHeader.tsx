
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  onUploadClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onUploadClick
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>
      <Button onClick={onUploadClick} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {t('dashboard.uploadDocument')}
      </Button>
    </div>
  );
};
