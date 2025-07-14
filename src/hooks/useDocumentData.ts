import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Signer, SignatureField } from '@/types/document';

export const useDocumentData = (documentId: string) => {
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [signers, setSigners] = useState<Signer[]>([]);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const signerColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];

  const loadDocumentData = async () => {
    try {
      console.log('Loading document data for:', documentId);
      
      // Load document details
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('file_url, name')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      if (document?.file_url) {
        const { data: urlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.file_url, 3600);
        
        if (urlData?.signedUrl) {
          setDocumentUrl(urlData.signedUrl);
        }
      }

      if (document?.name) {
        setDocumentName(document.name);
      }

      // Load existing signers with proper deduplication
      const { data: signersData, error: signersError } = await supabase
        .from('signers')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (signersError) throw signersError;

      if (signersData) {
        // Deduplicate by email, keeping the most recent entry
        const uniqueSignersMap = new Map();
        signersData.forEach(signer => {
          const existing = uniqueSignersMap.get(signer.email);
          if (!existing || new Date(signer.created_at) > new Date(existing.created_at)) {
            uniqueSignersMap.set(signer.email, signer);
          }
        });

        const uniqueSigners = Array.from(uniqueSignersMap.values());
        const loadedSigners = uniqueSigners.map((signer, index) => ({
          id: signer.id,
          name: signer.name,
          email: signer.email,
          color: signerColors[index % signerColors.length],
          status: signer.status
        }));
        
        setSigners(loadedSigners);
        console.log(`Loaded ${signersData.length} total signers, ${uniqueSigners.length} unique signers`);
      }

      // Load existing signature fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('signature_fields')
        .select('*')
        .eq('document_id', documentId);

      if (fieldsError) throw fieldsError;

      if (fieldsData) {
        const loadedFields = fieldsData.map(field => ({
          id: field.id,
          type: field.type as 'signature' | 'initial' | 'date' | 'text',
          x: Number(field.x),
          y: Number(field.y),
          width: Number(field.width),
          height: Number(field.height),
          page: field.page,
          signerEmail: field.signer_email,
          required: field.required,
          value: field.value || '',
          signed: !!field.signed_at,
          signer_email: field.signer_email
        }));
        setFields(loadedFields);
        console.log('Loaded fields:', loadedFields);
      }

    } catch (error: any) {
      console.error('Load error:', error);
      toast({
        title: "Load failed",
        description: error.message || "Failed to load document data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentData();
  }, [documentId]);

  return {
    documentUrl,
    documentName,
    signers,
    fields,
    loading,
    signerColors,
    setSigners,
    setFields
  };
};
