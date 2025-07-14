
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DragDropFieldCreator } from '../DragDropFieldCreator';
import { SignerManager } from './SignerManager';
import { FieldsSummary } from './FieldsSummary';
import type { Signer, SignatureField } from '@/types/document';

interface DocumentSidebarProps {
  signers: Signer[];
  fields: SignatureField[];
  selectedSigner: string;
  onSignersChange: (signers: Signer[]) => void;
  onSelectedSignerChange: (signerId: string) => void;
  onFieldAdd: (field: Omit<SignatureField, 'id'>) => void;
  previewMode: boolean;
  signerColors: string[];
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  signers,
  fields,
  selectedSigner,
  onSignersChange,
  onSelectedSignerChange,
  onFieldAdd,
  previewMode,
  signerColors
}) => {
  return (
    <div className="w-80 border-r bg-card p-4 overflow-y-auto">
      {!previewMode && (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Create Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropFieldCreator
                signers={signers}
                selectedSigner={selectedSigner}
                onFieldAdd={onFieldAdd}
              />
            </CardContent>
          </Card>
        </>
      )}

      <SignerManager
        signers={signers}
        fields={fields}
        selectedSigner={selectedSigner}
        onSignersChange={onSignersChange}
        onSelectedSignerChange={onSelectedSignerChange}
        previewMode={previewMode}
        signerColors={signerColors}
      />

      <div className="mt-4">
        <FieldsSummary fields={fields} />
      </div>
    </div>
  );
};
