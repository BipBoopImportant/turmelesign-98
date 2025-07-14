import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: documentsWithDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['documents-with-details', documents],
    queryFn: async () => {
      if (!documents) return [];
      
      const documentsWithDetails = await Promise.all(
        documents.map(async (doc) => {
          // Get signers count and status - filter for unique emails to avoid duplicates
          const { data: signersData } = await supabase
            .from('signers')
            .select('*')
            .eq('document_id', doc.id);

          // Remove duplicates by email and keep the latest created record
          const uniqueSigners = signersData ? 
            signersData.reduce((acc, signer) => {
              const existing = acc.find(s => s.email === signer.email);
              if (!existing || new Date(signer.created_at) > new Date(existing.created_at)) {
                // Remove existing signer with same email if found
                const filtered = acc.filter(s => s.email !== signer.email);
                return [...filtered, signer];
              }
              return acc;
            }, [] as typeof signersData) : [];

          // Get signature fields count
          const { data: fields } = await supabase
            .from('signature_fields')
            .select('*')
            .eq('document_id', doc.id);

          const signedCount = uniqueSigners.filter(s => s.status === 'completed').length;
          const declinedCount = uniqueSigners.filter(s => s.status === 'declined').length;
          const totalSigners = uniqueSigners.length;
          const totalFields = fields?.length || 0;
          
          // Determine actual document status based on signer statuses
          let actualStatus = doc.status;
          if (doc.status === 'sent' && uniqueSigners.length > 0) {
            const allCompleted = uniqueSigners.every(s => s.status === 'completed');
            const allDeclined = uniqueSigners.every(s => s.status === 'declined');
            const hasDeclined = uniqueSigners.some(s => s.status === 'declined');
            
            if (allCompleted) {
              actualStatus = 'completed';
            } else if (allDeclined) {
              actualStatus = 'declined';
            } else if (hasDeclined) {
              actualStatus = 'partially_declined';
            }
          }

          // Get signed URL if document is completed (either originally or now determined to be completed)
          let signedUrl = null;
          if ((doc.status === 'completed' || actualStatus === 'completed') && doc.file_url) {
            const { data: urlData } = await supabase.storage
              .from('documents')
              .createSignedUrl(doc.file_url, 3600);
            signedUrl = urlData?.signedUrl || null;
          }

          // Transform fields to match DocumentDownloader interface
          const transformedFields = fields?.map(field => ({
            ...field,
            signerEmail: field.signer_email,
            type: field.type as 'signature' | 'initial' | 'date' | 'text'
          })) || [];

          // Transform signers to match DocumentDownloader interface
          const transformedSigners = uniqueSigners.map(signer => ({
            ...signer,
            color: '#3B82F6'
          }));

          console.log(`Document ${doc.name}: Found ${signersData?.length || 0} total signers, ${totalSigners} unique signers`);

          return {
            ...doc,
            status: actualStatus,
            signers: transformedSigners,
            fields: transformedFields,
            signedCount,
            declinedCount,
            totalSigners,
            totalFields,
            documentUrl: signedUrl
          };
        })
      );
      
      return documentsWithDetails;
    },
    enabled: !!documents
  });

  return {
    documents,
    documentsWithDetails,
    isLoading,
    isLoadingDetails,
    refetch
  };
};
