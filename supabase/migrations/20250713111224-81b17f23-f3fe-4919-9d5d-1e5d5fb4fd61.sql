-- Clean up and fix all document policies for proper owner access
-- Remove duplicate SELECT policies
DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;
DROP POLICY IF EXISTS "Document owners can view their documents" ON public.documents;
DROP POLICY IF EXISTS "Public can view documents for pending signers" ON public.documents;

-- Create a single comprehensive SELECT policy for documents
CREATE POLICY "documents_access_policy" ON public.documents 
FOR SELECT USING (
  -- Document owners can always see their documents
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  -- Public can view documents if they have pending signers (for signing links)
  (status IN ('sent', 'completed') AND EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = documents.id 
    AND signers.status = 'pending'
  ))
);

-- Ensure other policies are correct for authenticated users
DROP POLICY IF EXISTS "documents_insert_policy" ON public.documents;
CREATE POLICY "documents_insert_policy" ON public.documents 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "documents_update_policy" ON public.documents;
CREATE POLICY "documents_update_policy" ON public.documents 
FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "documents_delete_policy" ON public.documents;
CREATE POLICY "documents_delete_policy" ON public.documents 
FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());