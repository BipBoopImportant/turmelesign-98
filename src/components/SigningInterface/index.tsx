import React, { useState, useMemo, useCallback } from 'react';
import { DeclineSigningDialog } from '@/components/DeclineSigningDialog';
import { ThankYouPage } from '@/components/ThankYouPage';
import { SigningFieldModal } from '@/components/SigningFieldModal';
import { useSigningData } from '@/hooks/useSigningData';
import { useSigningActions } from '@/hooks/useSigningActions';
import { useToast } from '@/hooks/use-toast';
import type { SignatureField } from '@/types/document';
import { SigningHeader } from './SigningHeader';
import { SigningInstructions } from './SigningInstructions';
import { SigningPDFViewer } from './SigningPDFViewer';
import { LoadingState } from './LoadingState';

interface SigningInterfaceProps {
  documentId: string;
  signerEmail: string;
  onComplete: () => void;
}

export const SigningInterface: React.FC<SigningInterfaceProps> = ({
  documentId,
  signerEmail,
  onComplete
}) => {
  const [selectedField, setSelectedField] = useState<SignatureField | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const { toast } = useToast();

  const {
    fields,
    setFields,
    documentUrl,
    loading,
    signerInfo
  } = useSigningData(documentId, signerEmail);

  const { handleSignField, completeSigning, declineSigning } = useSigningActions();

  const fieldStats = useMemo(() => {
    const completedFields = fields.filter(f => f.signed).length;
    const totalFields = fields.length;
    const requiredFields = fields.filter(f => f.required && !f.signed).length;
    
    return { completedFields, totalFields, requiredFields };
  }, [fields]);

  const handleFieldClick = useCallback((field: SignatureField) => {
    if (field.signed) {
      toast({
        title: "Field already signed",
        description: "This field has already been completed.",
        variant: "default"
      });
      return;
    }
    
    setSelectedField(field);
    setShowSigningModal(true);
  }, [toast]);

  const handleFieldSign = useCallback(async (
    fieldId: string, 
    value: string, 
    coordinates?: { x: number; y: number; width: number; height: number }
  ) => {
    await handleSignField(fieldId, value, coordinates, fields, setFields);
  }, [handleSignField, fields, setFields]);

  const handleCompleteSigning = useCallback(async () => {
    const success = await completeSigning(documentId, signerEmail, fields);
    if (success) {
      setShowThankYou(true);
    }
  }, [completeSigning, documentId, signerEmail, fields]);

  const handleDecline = useCallback(() => {
    setShowDeclineDialog(true);
  }, []);

  const handleDeclined = useCallback(async (documentId: string, signerEmail: string, reason?: string) => {
    const success = await declineSigning(documentId, signerEmail, reason);
    if (success) {
      onComplete();
    }
    return success;
  }, [declineSigning, onComplete]);

  if (loading) {
    return <LoadingState />;
  }

  if (showThankYou) {
    return (
      <ThankYouPage 
        signerName={signerInfo?.name}
        onGoHome={onComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SigningHeader
        signerInfo={signerInfo}
        completedFields={fieldStats.completedFields}
        totalFields={fieldStats.totalFields}
        requiredFields={fieldStats.requiredFields}
        onDecline={handleDecline}
        onComplete={handleCompleteSigning}
      />

      <SigningInstructions requiredFields={fieldStats.requiredFields} />

      <div className="flex-1">
        <SigningPDFViewer
          documentUrl={documentUrl}
          fields={fields}
          signerInfo={signerInfo}
          signerEmail={signerEmail}
          onFieldClick={handleFieldClick}
        />
      </div>

      <SigningFieldModal
        field={selectedField}
        open={showSigningModal}
        onOpenChange={setShowSigningModal}
        onSign={handleFieldSign}
      />

      <DeclineSigningDialog
        open={showDeclineDialog}
        onOpenChange={setShowDeclineDialog}
        documentId={documentId}
        signerEmail={signerEmail}
        onDeclined={() => onComplete()}
        onDeclineAction={handleDeclined}
      />
    </div>
  );
};