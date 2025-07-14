import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle } from 'lucide-react';

interface SigningInstructionsProps {
  requiredFields: number;
}

export const SigningInstructions: React.FC<SigningInstructionsProps> = ({
  requiredFields
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-blue-50 border-b p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-blue-800">
          <CheckCircle className="h-5 w-5" />
          <p className="text-sm">
            {t('signing.clickFields')}
            {requiredFields > 0 && ` ${t('signing.completeRequired').replace('{count}', requiredFields.toString())}`}
          </p>
        </div>
      </div>
    </div>
  );
};