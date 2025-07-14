
import React, { useState } from 'react';
import { PDFViewer } from './PDFViewer';
import { ShareDocumentDialog } from './ShareDocumentDialog';
import { DocumentEditorHeader } from './DocumentEditor/DocumentEditorHeader';
import { DocumentSidebar } from './DocumentEditor/DocumentSidebar';
import { useDocumentData } from '@/hooks/useDocumentData';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import type { DocumentEditorProps, SignatureField } from '@/types/document';

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ documentId, onClose }) => {
  const [selectedSigner, setSelectedSigner] = useState<string>('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const {
    documentUrl,
    documentName,
    signers,
    fields,
    loading,
    signerColors,
    setSigners,
    setFields
  } = useDocumentData(documentId);

  const { saving, saveDocument, sendDocument } = useDocumentActions(
    documentId,
    signers,
    fields,
    onClose
  );

  const handleFieldAdd = (fieldData: Omit<SignatureField, 'id'>) => {
    const newField: SignatureField = {
      ...fieldData,
      id: Date.now().toString()
    };
    setFields([...fields, newField]);
    console.log('Added field:', newField);
  };

  const handleFieldRemove = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    console.log('Removed field:', fieldId);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<SignatureField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const handleSignersChange = (newSigners: typeof signers) => {
    setSigners(newSigners);
    // Remove fields for deleted signers
    const signerEmails = new Set(newSigners.map(s => s.email));
    setFields(fields.filter(f => signerEmails.has(f.signerEmail)));
  };

  const handleSelectedSignerChange = (signerId: string) => {
    setSelectedSigner(signerId);
  };

  // Set initial selected signer when signers are loaded
  React.useEffect(() => {
    if (signers.length > 0 && !selectedSigner) {
      setSelectedSigner(signers[0].id);
    }
  }, [signers, selectedSigner]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  const totalFields = fields.length;
  const totalSigners = signers.length;

  return (
    <div className="min-h-screen bg-background">
      <DocumentEditorHeader
        onClose={onClose}
        totalFields={totalFields}
        totalSigners={totalSigners}
        documentId={documentId}
        documentUrl={documentUrl}
        documentName={documentName}
        fields={fields}
        signers={signers}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        onSave={saveDocument}
        onSend={sendDocument}
        onShowShareDialog={() => setShowShareDialog(true)}
        saving={saving}
      />

      <div className="flex h-[calc(100vh-80px)]">
        <DocumentSidebar
          signers={signers}
          fields={fields}
          selectedSigner={selectedSigner}
          onSignersChange={handleSignersChange}
          onSelectedSignerChange={handleSelectedSignerChange}
          onFieldAdd={handleFieldAdd}
          previewMode={previewMode}
          signerColors={signerColors}
        />

        <div className="flex-1">
          {documentUrl ? (
            <PDFViewer
              fileUrl={documentUrl}
              fields={fields}
              signers={signers}
              selectedTool={null}
              selectedSigner={selectedSigner}
              onFieldAdd={handleFieldAdd}
              onFieldRemove={handleFieldRemove}
              onFieldUpdate={handleFieldUpdate}
              editable={!previewMode}
              mode="edit"
              enableDragDrop={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <p className="text-gray-400 text-lg mb-2">Loading document...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ShareDocumentDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        documentId={documentId}
        documentName={documentName || 'Document'}
        signers={signers}
      />
    </div>
  );
};
