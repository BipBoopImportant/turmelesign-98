import React from 'react';
import { PDFViewer } from '@/components/PDFViewer';
import type { SignatureField } from '@/types/document';

interface SigningPDFViewerProps {
  documentUrl: string;
  fields: SignatureField[];
  signerInfo: { name: string; email: string } | null;
  signerEmail: string;
  onFieldClick: (field: SignatureField) => void;
}

export const SigningPDFViewer: React.FC<SigningPDFViewerProps> = ({
  documentUrl,
  fields,
  signerInfo,
  signerEmail,
  onFieldClick
}) => {
  if (!documentUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-400 text-lg">Loading document...</p>
      </div>
    );
  }

  const mappedFields = fields.map(f => ({
    id: f.id,
    type: f.type as 'signature' | 'initial' | 'date' | 'text',
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    page: f.page,
    signerEmail: f.signer_email,
    required: f.required,
    value: f.value
  }));

  const signers = signerInfo ? [{ 
    id: '1', 
    name: signerInfo.name, 
    email: signerEmail, 
    color: 'bg-blue-500' 
  }] : [];

  return (
    <PDFViewer
      fileUrl={documentUrl}
      fields={mappedFields}
      signers={signers}
      selectedTool={null}
      selectedSigner=""
      onFieldAdd={() => {}}
      onFieldRemove={() => {}}
      onFieldClick={onFieldClick}
      editable={false}
      mode="sign"
    />
  );
};