
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SigningField {
  id: string;
  required: boolean;
  signed: boolean;
}

export const useSigningCompletion = (
  documentId: string,
  signerEmail: string,
  onComplete: () => void
) => {
  const { toast } = useToast();

  const completeSigning = async (
    fields: SigningField[],
    signatureData: string,
    initialData: string
  ) => {
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
      const { error: signerError } = await supabase
        .from('signers')
        .update({
          status: 'completed',
          signed_at: new Date().toISOString(),
          signature_data: signatureData || initialData
        })
        .eq('document_id', documentId)
        .eq('email', signerEmail);

      if (signerError) throw signerError;

      const { data: signers, error: signersError } = await supabase
        .from('signers')
        .select('status')
        .eq('document_id', documentId);

      if (signersError) throw signersError;

      const allCompleted = signers?.every(s => s.status === 'completed');
      
      if (allCompleted) {
        const { error: docError } = await supabase
          .from('documents')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
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
  };

  return { completeSigning };
};
