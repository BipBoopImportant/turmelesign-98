import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SignatureField } from '@/types/document';

export const useSigningActions = () => {
  const { toast } = useToast();

  const handleSignField = useCallback(async (
    fieldId: string, 
    value: string, 
    coordinates: { x: number; y: number; width: number; height: number } | undefined,
    fields: SignatureField[],
    setFields: (fields: SignatureField[]) => void
  ) => {
    // Optimistically update UI
    setFields(fields.map(field => 
      field.id === fieldId 
        ? { ...field, value, signed: true, coordinates }
        : field
    ));

    try {
      const updateData: any = {
        value: value,
        signed_at: new Date().toISOString()
      };
      
      // Store exact coordinates if provided
      if (coordinates) {
        updateData.signature_coordinates = JSON.stringify(coordinates);
        console.log('Storing signature coordinates:', coordinates);
      }

      const { error } = await supabase
        .from('signature_fields')
        .update(updateData)
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Field signed",
        description: "Your signature has been applied successfully."
      });
    } catch (error: any) {
      console.error('Error updating field:', error);
      
      // Revert optimistic update on error
      setFields(fields.map(field => 
        field.id === fieldId 
          ? { ...field, value: '', signed: false, coordinates: undefined }
          : field
      ));
      
      toast({
        title: "Error",
        description: "Failed to save signature",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const completeSigning = useCallback(async (documentId: string, signerEmail: string, fields: SignatureField[]): Promise<boolean> => {
    const requiredFields = fields.filter(f => f.required);
    const unSignedRequired = requiredFields.filter(f => !f.signed);

    if (unSignedRequired.length > 0) {
      toast({
        title: "Required fields missing",
        description: `Please complete ${unSignedRequired.length} required field(s).`,
        variant: "destructive"
      });
      return false;
    }

    try {
      // Update signer status and check all signers completion in parallel
      const [signerUpdateResult, signersQueryResult] = await Promise.all([
        supabase
          .from('signers')
          .update({
            status: 'completed',
            signed_at: new Date().toISOString()
          })
          .eq('document_id', documentId)
          .eq('email', signerEmail),
        supabase
          .from('signers')
          .select('status')
          .eq('document_id', documentId)
      ]);

      if (signerUpdateResult.error) throw signerUpdateResult.error;
      if (signersQueryResult.error) throw signersQueryResult.error;

      const allCompleted = signersQueryResult.data?.every(s => s.status === 'completed');
      const allDeclined = signersQueryResult.data?.every(s => s.status === 'declined');
      const hasDeclined = signersQueryResult.data?.some(s => s.status === 'declined');
      
      // Update document status based on signer statuses
      let newDocumentStatus = null;
      if (allCompleted) {
        newDocumentStatus = 'completed';
      } else if (allDeclined) {
        newDocumentStatus = 'declined';
      } else if (hasDeclined) {
        newDocumentStatus = 'partially_declined';
      }
      
      if (newDocumentStatus) {
        const updateData: any = { status: newDocumentStatus };
        if (newDocumentStatus === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }
        
        const { error: docError } = await supabase
          .from('documents')
          .update(updateData)
          .eq('id', documentId);

        if (docError) throw docError;
      }

      toast({
        title: "Document signed!",
        description: "Your signature has been recorded successfully."
      });

      return true;
    } catch (error: any) {
      console.error('Signing error:', error);
      toast({
        title: "Signing failed",
        description: error.message || "Failed to complete signing",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const declineSigning = useCallback(async (documentId: string, signerEmail: string, reason?: string): Promise<boolean> => {
    try {
      // Update signer status and check all signers statuses in parallel
      const [signerUpdateResult, signersQueryResult] = await Promise.all([
        supabase
          .from('signers')
          .update({
            status: 'declined',
            signed_at: new Date().toISOString(),
            signature_data: reason || 'Declined without reason'
          })
          .eq('document_id', documentId)
          .eq('email', signerEmail),
        supabase
          .from('signers')
          .select('status')
          .eq('document_id', documentId)
      ]);

      if (signerUpdateResult.error) throw signerUpdateResult.error;
      if (signersQueryResult.error) throw signersQueryResult.error;

      const allCompleted = signersQueryResult.data?.every(s => s.status === 'completed');
      const allDeclined = signersQueryResult.data?.every(s => s.status === 'declined');
      const hasDeclined = signersQueryResult.data?.some(s => s.status === 'declined');
      
      // Update document status based on signer statuses
      let newDocumentStatus = null;
      if (allCompleted) {
        newDocumentStatus = 'completed';
      } else if (allDeclined) {
        newDocumentStatus = 'declined';
      } else if (hasDeclined) {
        newDocumentStatus = 'partially_declined';
      }
      
      if (newDocumentStatus) {
        const updateData: any = { status: newDocumentStatus };
        if (newDocumentStatus === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }
        
        const { error: docError } = await supabase
          .from('documents')
          .update(updateData)
          .eq('id', documentId);

        if (docError) throw docError;
      }

      toast({
        title: "Document declined",
        description: "You have successfully declined to sign this document."
      });

      return true;
    } catch (error: any) {
      console.error('Decline error:', error);
      toast({
        title: "Error declining document",
        description: error.message || "Failed to decline document",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    handleSignField,
    completeSigning,
    declineSigning
  };
};