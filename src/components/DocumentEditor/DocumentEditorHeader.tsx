
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Save, Send, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { DocumentDownloader } from '../DocumentDownloader';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Signer, SignatureField } from '@/types/document';

interface DocumentEditorHeaderProps {
  onClose: () => void;
  totalFields: number;
  totalSigners: number;
  documentId: string;
  documentUrl: string;
  documentName: string;
  fields: SignatureField[];
  signers: Signer[];
  previewMode: boolean;
  onTogglePreview: () => void;
  onSave: () => void;
  onSend: () => void;
  onShowShareDialog: () => void;
  saving: boolean;
}

export const DocumentEditorHeader: React.FC<DocumentEditorHeaderProps> = ({
  onClose,
  totalFields,
  totalSigners,
  documentId,
  documentUrl,
  documentName,
  fields,
  signers,
  previewMode,
  onTogglePreview,
  onSave,
  onSend,
  onShowShareDialog,
  saving
}) => {
  const { t } = useLanguage();
  return (
    <div className="border-b p-4 bg-white">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{t('editor.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {totalFields} {totalFields !== 1 ? t('editor.fields') : t('editor.field')} • {totalSigners} {totalSigners !== 1 ? t('editor.signers') : t('editor.signer')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DocumentDownloader
            documentId={documentId}
            documentUrl={documentUrl}
            fields={fields}
            signers={signers}
            documentName={documentName}
          />
          <Button 
            variant="outline" 
            onClick={onShowShareDialog}
            disabled={totalSigners === 0}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t('editor.shareLinks')}
          </Button>
          <Button 
            variant="outline" 
            onClick={onTogglePreview}
            className="flex items-center gap-2"
          >
            {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewMode ? t('editor.editMode') : t('editor.previewMode')}
          </Button>
          <Button 
            variant="outline" 
            onClick={onSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('editor.saving') : t('common.save')}
          </Button>
          <Button 
            onClick={onSend}
            disabled={saving || totalSigners === 0 || totalFields === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {t('editor.sendForSignature')}
          </Button>
        </div>
      </div>
    </div>
  );
};
