
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenTool, Type, Calendar, Hash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SignatureField } from '@/types/document';

interface FieldsSummaryProps {
  fields: SignatureField[];
}


export const FieldsSummary: React.FC<FieldsSummaryProps> = ({ fields }) => {
  const { t } = useLanguage();
  
  const getFieldTypes = (t: (key: string) => string) => [
    { type: 'signature' as const, icon: PenTool, label: t('fieldCreator.signature'), color: 'bg-blue-500' },
    { type: 'initial' as const, icon: Hash, label: t('fieldCreator.initial'), color: 'bg-green-500' },
    { type: 'date' as const, icon: Calendar, label: t('fieldCreator.date'), color: 'bg-purple-500' },
    { type: 'text' as const, icon: Type, label: t('fieldCreator.text'), color: 'bg-orange-500' },
  ];
  
  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t('fieldsSummary.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {getFieldTypes(t).map(({ type, label, color }) => {
            const count = fields.filter(f => f.type === type).length;
            if (count === 0) return null;
            
            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-sm">{label}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
