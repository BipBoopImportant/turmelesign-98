import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Move, Eye, Edit3 } from 'lucide-react';

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
  value?: string;
}

interface Signer {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface SignatureFieldProps {
  field: SignatureField;
  signer?: Signer;
  isSelected: boolean;
  isFieldDragging: boolean;
  isFieldResizing: boolean;
  previewValue?: string;
  rotation: number;
  editable: boolean;
  mode: 'edit' | 'sign';
  liveUpdates?: Partial<SignatureField>;
  onMouseDown: (e: React.MouseEvent, fieldId: string, handle?: string) => void;
  onClick: (e: React.MouseEvent) => void;
  onRemove: (fieldId: string) => void;
  onPreview: (fieldId: string, fieldType: 'signature' | 'initial' | 'date' | 'text') => void;
  onClearPreview: (fieldId: string) => void;
}

export const SignatureFieldComponent: React.FC<SignatureFieldProps> = ({
  field,
  signer,
  isSelected,
  isFieldDragging,
  isFieldResizing,
  previewValue,
  rotation,
  editable,
  mode,
  liveUpdates,
  onMouseDown,
  onClick,
  onRemove,
  onPreview,
  onClearPreview
}) => {
  const fieldProps = liveUpdates ? { ...field, ...liveUpdates } : field;

  const renderFieldContent = () => {
    if (mode === 'sign' && field.value) {
      if (field.type === 'signature' || field.type === 'initial') {
        return (
          <img 
            src={field.value} 
            alt={field.type}
            className="max-w-full max-h-full object-contain"
          />
        );
      } else {
        return (
          <div className="text-xs font-medium text-gray-900 px-1 truncate">
            {field.value}
          </div>
        );
      }
    }

    if (previewValue) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          {field.type === 'signature' || field.type === 'initial' ? (
            <img 
              src={previewValue} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div 
              className="text-xs font-medium text-gray-900 px-1 text-center leading-tight"
              style={{
                fontSize: `${Math.min(fieldProps.height * 0.4, 0.7)}rem`
              }}
            >
              {previewValue}
            </div>
          )}
        </div>
      );
    }

    return (
      <span 
        className="text-xs font-medium text-gray-700 select-none"
        style={{
          fontSize: `${Math.min(fieldProps.height * 0.15, 0.8)}rem`,
          transform: fieldProps.width < fieldProps.height * 2 ? 'rotate(-90deg)' : 'none'
        }}
      >
        {field.type.toUpperCase()}
      </span>
    );
  };

  return (
    <div
      className={`absolute border-2 transition-none ${
        isFieldDragging || isFieldResizing ? 'z-50 shadow-lg' : 'z-10'
      } ${
        isSelected 
          ? 'border-blue-500 border-solid shadow-md' 
          : `border-dashed ${signer?.color.replace('bg-', 'border-') || 'border-gray-400'}`
      } ${
        editable && mode === 'edit' ? 'cursor-move hover:shadow-md' : mode === 'sign' ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
      } group`}
      style={{
        left: `${fieldProps.x}%`,
        top: `${fieldProps.y}%`,
        width: `${fieldProps.width}%`,
        height: `${fieldProps.height}%`,
        transform: `rotate(${rotation}deg)`,
        opacity: isFieldDragging || isFieldResizing ? 0.9 : 1,
        willChange: isFieldDragging || isFieldResizing ? 'transform' : 'auto'
      }}
      onMouseDown={(e) => {
        if (mode === 'edit' && editable) {
          onMouseDown(e, field.id);
        }
      }}
      onClick={onClick}
    >
      <div className={`w-full h-full ${signer?.color} opacity-20 flex items-center justify-center relative overflow-hidden`}>
        {renderFieldContent()}
        
        {/* Preview button for field interaction */}
        {editable && mode === 'edit' && !previewValue && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition-all cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(field.id, field.type);
            }}
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white p-1 rounded text-xs flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Preview
            </div>
          </div>
        )}

        {editable && mode === 'edit' && isSelected && (
          <>
            {/* Preview and Delete buttons */}
            <div className="absolute -top-8 -right-8 flex gap-1">
              {!previewValue && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(field.id, field.type);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
              {previewValue && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600 text-white border-green-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearPreview(field.id);
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(field.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Resize handles */}
            <div 
              className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white cursor-nw-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => onMouseDown(e, field.id, 'nw')}
            />
            <div 
              className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-ne-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => onMouseDown(e, field.id, 'ne')}
            />
            <div 
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white cursor-sw-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => onMouseDown(e, field.id, 'sw')}
            />
            <div 
              className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-se-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => onMouseDown(e, field.id, 'se')}
            />

            {/* Move handle */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-500 text-white p-1 rounded cursor-move flex items-center hover:bg-blue-600 transition-colors">
                <Move className="h-3 w-3" />
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <Badge 
          variant="secondary" 
          className="text-xs whitespace-nowrap"
        >
          {signer?.name} - {field.type}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Badge>
      </div>
    </div>
  );
};