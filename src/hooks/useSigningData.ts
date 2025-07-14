import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SignatureField } from '@/types/document';

interface SignerInfo {
  name: string;
  email: string;
}

interface UseSigningDataReturn {
  fields: SignatureField[];
  setFields: React.Dispatch<React.SetStateAction<SignatureField[]>>;
  documentUrl: string;
  loading: boolean;
  error: string | null;
  signerInfo: SignerInfo | null;
  refetch: () => Promise<void>;
}

export const useSigningData = (documentId: string, signerEmail: string): UseSigningDataReturn => {
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signerInfo, setSignerInfo] = useState<SignerInfo | null>(null);
  const { toast } = useToast();

  const loadSigningData = useCallback(async () => {
    if (!documentId || !signerEmail) {
      setError('Missing document ID or signer email');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading signing data for:', { documentId, signerEmail });
      
      // Load document and file URL in parallel
      const [documentResult, signersResult] = await Promise.all([
        supabase
          .from('documents')
          .select('file_url')
          .eq('id', documentId)
          .maybeSingle(),
        supabase
          .from('signers')
          .select('name, email')
          .eq('document_id', documentId)
          .eq('email', signerEmail)
          .maybeSingle()
      ]);

      if (documentResult.error) {
        console.error('Document query error:', documentResult.error);
        throw new Error('Failed to load document');
      }

      if (signersResult.error) {
        console.error('Signers query error:', signersResult.error);
        throw signersResult.error;
      }
      
      if (!signersResult.data) {
        throw new Error('No signer found for this document and email combination');
      }
      
      setSignerInfo(signersResult.data);

      // Load document URL if available
      if (documentResult.data?.file_url) {
        const { data: urlData, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(documentResult.data.file_url, 3600);
        
        if (urlError) {
          console.error('Failed to create signed URL:', urlError);
        } else if (urlData?.signedUrl) {
          setDocumentUrl(urlData.signedUrl);
        }
      }

      // Load signature fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('signature_fields')
        .select('*')
        .eq('document_id', documentId)
        .eq('signer_email', signerEmail)
        .order('created_at');

      if (fieldsError) {
        console.error('Fields query error:', fieldsError);
        throw fieldsError;
      }

      if (fieldsData) {
        const loadedFields = fieldsData.map(field => ({
          id: field.id,
          type: field.type as 'signature' | 'initial' | 'date' | 'text',
          x: Number(field.x),
          y: Number(field.y),
          width: Number(field.width),
          height: Number(field.height),
          required: field.required,
          value: field.value || '',
          signed: !!field.signed_at,
          page: field.page,
          signerEmail: field.signer_email,
          signer_email: field.signer_email
        }));
        setFields(loadedFields);
        console.log('Loaded fields:', loadedFields);
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load signing data';
      console.error('Load error:', error);
      setError(errorMessage);
      toast({
        title: "Load failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, signerEmail, toast]);

  useEffect(() => {
    loadSigningData();
  }, [loadSigningData]);

  const memoizedReturn = useMemo(() => ({
    fields,
    setFields,
    documentUrl,
    loading,
    error,
    signerInfo,
    refetch: loadSigningData
  }), [fields, documentUrl, loading, error, signerInfo, loadSigningData]);

  return memoizedReturn;
};