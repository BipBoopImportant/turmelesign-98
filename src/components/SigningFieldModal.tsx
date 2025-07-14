
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { PenTool, Calendar, Type, Hash, X } from 'lucide-react';

interface SigningField {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  value?: string;
  signed: boolean;
  page: number;
  signer_email: string;
}

interface SigningFieldModalProps {
  field: SigningField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (fieldId: string, value: string, coordinates?: { x: number; y: number; width: number; height: number }) => void;
}

export const SigningFieldModal: React.FC<SigningFieldModalProps> = ({
  field,
  open,
  onOpenChange,
  onSign
}) => {
  const { t } = useLanguage();
  const [signatureData, setSignatureData] = useState<string>('');
  const [textValue, setTextValue] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureCoordinates, setSignatureCoordinates] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [drawnBounds, setDrawnBounds] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setSignatureData('');
      setTextValue('');
      setSignatureCoordinates(null);
      setDrawnBounds(null);
      clearCanvas();
    }
  }, [open, field]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Initialize bounds tracking
    setDrawnBounds({ minX: x, minY: y, maxX: x, maxY: y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Update bounds tracking
    setDrawnBounds(prev => prev ? {
      minX: Math.min(prev.minX, x),
      minY: Math.min(prev.minY, y),
      maxX: Math.max(prev.maxX, x),
      maxY: Math.max(prev.maxY, y)
    } : { minX: x, minY: y, maxX: x, maxY: y });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas && drawnBounds && field) {
      setSignatureData(canvas.toDataURL());
      
      // Calculate exact signature coordinates relative to the original field
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Convert drawn bounds to percentages within the field
      const signatureWidthPercent = ((drawnBounds.maxX - drawnBounds.minX) / canvasWidth) * field.width;
      const signatureHeightPercent = ((drawnBounds.maxY - drawnBounds.minY) / canvasHeight) * field.height;
      const signatureXPercent = field.x + ((drawnBounds.minX / canvasWidth) * field.width);
      const signatureYPercent = field.y + ((drawnBounds.minY / canvasHeight) * field.height);
      
      const exactCoords = {
        x: signatureXPercent,
        y: signatureYPercent,
        width: signatureWidthPercent,
        height: signatureHeightPercent
      };
      
      setSignatureCoordinates(exactCoords);
      console.log('Captured exact signature coordinates:', exactCoords);
      console.log('Original field bounds:', { x: field.x, y: field.y, width: field.width, height: field.height });
      console.log('Drawn bounds on canvas:', drawnBounds);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData('');
      setSignatureCoordinates(null);
      setDrawnBounds(null);
    }
  };

  const handleApply = () => {
    if (!field) return;

    let value = '';
    
    switch (field.type) {
      case 'signature':
      case 'initial':
        value = signatureData;
        break;
      case 'date':
        value = new Date().toLocaleDateString();
        break;
      case 'text':
        value = textValue.trim();
        break;
    }

    if (value) {
      onSign(field.id, value, signatureCoordinates || undefined);
      onOpenChange(false);
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'signature': return <PenTool className="h-5 w-5" />;
      case 'initial': return <Hash className="h-5 w-5" />;
      case 'date': return <Calendar className="h-5 w-5" />;
      case 'text': return <Type className="h-5 w-5" />;
      default: return <PenTool className="h-5 w-5" />;
    }
  };

  const canApply = () => {
    if (!field) return false;
    
    switch (field.type) {
      case 'signature':
      case 'initial':
        return !!signatureData;
      case 'date':
        return true;
      case 'text':
        return textValue.trim().length > 0;
      default:
        return false;
    }
  };

  if (!field) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFieldIcon(field.type)}
            {t('fieldModal.completeField').replace('{type}', field.type.charAt(0).toUpperCase() + field.type.slice(1))}
            {field.required && <span className="text-red-500">{t('fieldModal.required')}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Field preview to show exact position */}
          <div ref={fieldPreviewRef} className="text-sm text-muted-foreground">
            {t('fieldModal.fieldPosition')}: {field.x.toFixed(1)}%, {field.y.toFixed(1)}% 
            ({t('fieldModal.fieldSize')}: {field.width.toFixed(1)}% × {field.height.toFixed(1)}%)
          </div>

          {(field.type === 'signature' || field.type === 'initial') && (
            <div className="space-y-4">
              <Label className="text-base font-medium">
                {t('fieldModal.drawYour').replace('{type}', field.type)}
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={field.type === 'signature' ? 200 : 120}
                  className="border border-gray-200 cursor-crosshair w-full bg-white rounded"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCanvas}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('common.clear')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {field.type === 'text' && (
            <div className="space-y-4">
              <Label className="text-base font-medium">
                {t('fieldModal.enterYourText')}
              </Label>
              <Textarea
                placeholder={t('fieldModal.textPlaceholder')}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                className="min-h-[120px] text-base"
                autoFocus
              />
            </div>
          )}

          {field.type === 'date' && (
            <div className="space-y-4">
              <Label className="text-base font-medium">
                {t('fieldModal.todayDateInserted')}
              </Label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-lg font-medium">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleApply}
              disabled={!canApply()}
              className="min-w-[120px]"
            >
              {t('common.apply')} {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
