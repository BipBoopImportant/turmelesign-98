
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Plus } from 'lucide-react';

interface EmptyStateProps {
  onUploadClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onUploadClick }) => {
  const { t } = useLanguage();

  return (
    <div className="text-center py-12">
      <FileText className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">{t('dashboard.noDocuments')}</h3>
      <p className="text-muted-foreground mb-4">{t('dashboard.uploadFirstDocument')}</p>
      <Button onClick={onUploadClick}>
        <Plus className="h-4 w-4 mr-2" />
        {t('dashboard.uploadDocument')}
      </Button>
    </div>
  );
};
