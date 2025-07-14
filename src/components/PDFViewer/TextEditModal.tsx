import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface TextEditModalProps {
  isOpen: boolean;
  fieldId: string;
  value: string;
  onValueChange: (fieldId: string, value: string) => void;
  onComplete: () => void;
}

export const TextEditModal: React.FC<TextEditModalProps> = ({
  isOpen,
  fieldId,
  value,
  onValueChange,
  onComplete
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">{t('textModal.title')}</h3>
        <Textarea
          placeholder={t('textModal.placeholder')}
          value={value}
          onChange={(e) => onValueChange(fieldId, e.target.value)}
          className="min-h-[100px] mb-4"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onComplete}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onComplete}>
            {t('textModal.applyPreview')}
          </Button>
        </div>
      </div>
    </div>
  );
};