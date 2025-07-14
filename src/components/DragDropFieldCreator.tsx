
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  PenTool, 
  Type, 
  Calendar, 
  Hash,
  GripVertical
} from 'lucide-react';

interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  signerEmail: string;
  required: boolean;
}

interface Signer {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface DragDropFieldCreatorProps {
  signers: Signer[];
  selectedSigner: string;
  onFieldAdd: (field: Omit<SignatureField, 'id'>) => void;
}

const getFieldTypes = (t: (key: string) => string) => [
  { type: 'signature', icon: PenTool, label: t('fieldCreator.signature'), color: 'bg-blue-500' },
  { type: 'initial', icon: Hash, label: t('fieldCreator.initial'), color: 'bg-green-500' },
  { type: 'date', icon: Calendar, label: t('fieldCreator.date'), color: 'bg-purple-500' },
  { type: 'text', icon: Type, label: t('fieldCreator.text'), color: 'bg-orange-500' },
];

export const DragDropFieldCreator: React.FC<DragDropFieldCreatorProps> = ({
  signers,
  selectedSigner,
  onFieldAdd
}) => {
  const { t } = useLanguage();
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const dragImageRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, type: string) => {
    setDraggedType(type);
    e.dataTransfer.setData('fieldType', type);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a custom drag image
    if (dragImageRef.current) {
      const rect = dragImageRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(dragImageRef.current, rect.width / 2, rect.height / 2);
    }
  };

  const handleDragEnd = () => {
    setDraggedType(null);
  };

  const selectedSignerData = signers.find(s => s.id === selectedSigner);
  const fieldTypes = getFieldTypes(t);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        {t('fieldCreator.dragDropFields')}
      </div>
      
      {selectedSignerData && (
        <div className="mb-3 p-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${selectedSignerData.color}`} />
            <span className="text-sm font-medium">{selectedSignerData.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('fieldCreator.dragFieldsToPDF')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {fieldTypes.map(({ type, icon: Icon, label, color }) => (
          <Card
            key={type}
            className={`cursor-grab active:cursor-grabbing transition-all duration-150 hover:scale-105 hover:shadow-md ${
              draggedType === type ? 'scale-95 opacity-50' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            onDragEnd={handleDragEnd}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
                <GripVertical className="h-3 w-3 ml-auto text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!selectedSigner && (
        <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t('fieldCreator.selectSignerFirst')}
          </p>
        </div>
      )}

      {/* Hidden drag image */}
      <div
        ref={dragImageRef}
        className="absolute -left-full -top-full pointer-events-none bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium"
      >
        📝 {t('fieldCreator.field')}
      </div>
    </div>
  );
};
