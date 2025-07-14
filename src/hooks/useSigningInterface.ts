
import { useSigningData } from './useSigningData';
import { useSigningActions } from './useSigningActions';

export const useSigningInterface = (documentId: string, signerEmail: string) => {
  const { fields, setFields, documentUrl, loading, signerInfo } = useSigningData(documentId, signerEmail);
  const { handleSignField: handleSignFieldAction, completeSigning: completeSigningAction } = useSigningActions();

  const handleSignField = async (fieldId: string, value: string, coordinates?: { x: number; y: number; width: number; height: number }) => {
    return handleSignFieldAction(fieldId, value, coordinates, fields, setFields);
  };

  const completeSigning = async () => {
    return completeSigningAction(documentId, signerEmail, fields);
  };

  return {
    fields,
    documentUrl,
    loading,
    signerInfo,
    handleSignField,
    completeSigning
  };
};
