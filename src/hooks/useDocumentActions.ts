
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Signer, SignatureField } from '@/types/document';

export const useDocumentActions = (
  documentId: string,
  signers: Signer[],
  fields: SignatureField[],
  onClose: () => void
) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const saveDocument = async () => {
    if (signers.length === 0) {
      toast({
        title: "No signers",
        description: "Please add at least one signer before saving.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      console.log('Saving document with signers:', signers.length, 'fields:', fields.length);
      
      // Save signers with duplicate prevention
      for (const signer of signers) {
        const isNewSigner = signer.id.length > 10; // Temporary IDs are timestamps
        
        if (isNewSigner) {
          // Check if signer with this email already exists for this document
          const { data: existingSigner } = await supabase
            .from('signers')
            .select('id')
            .eq('document_id', documentId)
            .eq('email', signer.email)
            .single();

          if (!existingSigner) {
            const { error: signerError } = await supabase
              .from('signers')
              .insert({
                document_id: documentId,
                name: signer.name,
                email: signer.email,
                status: 'pending'
              });
            
            if (signerError) throw signerError;
            console.log('Inserted new signer:', signer.email);
          } else {
            console.log('Signer already exists, skipping:', signer.email);
          }
        } else {
          const { error: signerError } = await supabase
            .from('signers')
            .update({
              name: signer.name,
              email: signer.email
            })
            .eq('id', signer.id);
          
          if (signerError) throw signerError;
        }
      }

      // Clear existing fields and save new ones
      await supabase
        .from('signature_fields')
        .delete()
        .eq('document_id', documentId);

      // Save signature fields
      if (fields.length > 0) {
        const fieldsToInsert = fields.map(field => ({
          document_id: documentId,
          type: field.type,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          page: field.page,
          signer_email: field.signerEmail,
          required: field.required
        }));

        const { error: fieldError } = await supabase
          .from('signature_fields')
          .insert(fieldsToInsert);
        
        if (fieldError) throw fieldError;
      }

      toast({
        title: "Success",
        description: "Document saved successfully!"
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save document",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const sendDocument = async () => {
    if (signers.length === 0) {
      toast({
        title: "No signers",
        description: "Please add at least one signer before sending.",
        variant: "destructive"
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "No fields",
        description: "Please add at least one signature field before sending.",
        variant: "destructive"
      });
      return;
    }

    try {
      await saveDocument();
      
      // Update document status
      const { error } = await supabase
        .from('documents')
        .update({ status: 'sent' })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document sent!",
        description: `Document sent to ${signers.length} signer(s).`
      });

      onClose();
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: "Send failed",
        description: error.message || "Failed to send document",
        variant: "destructive"
      });
    }
  };

  return {
    saving,
    saveDocument,
    sendDocument
  };
};
