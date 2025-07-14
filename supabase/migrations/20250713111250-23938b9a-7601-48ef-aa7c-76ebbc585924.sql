-- Fix signers policies for comprehensive access
DROP POLICY IF EXISTS "signers_select_policy" ON public.signers;
DROP POLICY IF EXISTS "Public can view own pending signer record" ON public.signers;
DROP POLICY IF EXISTS "Public can complete own signing" ON public.signers;
DROP POLICY IF EXISTS "Public can update signer status for signing" ON public.signers;

-- Comprehensive signers access policy
CREATE POLICY "signers_access_policy" ON public.signers 
FOR SELECT USING (
  -- Document owners can see all signers for their documents
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signers.document_id 
    AND documents.user_id = auth.uid()
  )) OR
  -- Public can view pending signer records (for signing)
  (status = 'pending')
);

-- Signers insert policy (only document owners)
DROP POLICY IF EXISTS "signers_insert_policy" ON public.signers;
CREATE POLICY "signers_insert_policy" ON public.signers 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signers.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Signers update policy
DROP POLICY IF EXISTS "signers_update_policy" ON public.signers;
CREATE POLICY "signers_update_policy" ON public.signers 
FOR UPDATE USING (
  -- Document owners can update
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signers.document_id 
    AND documents.user_id = auth.uid()
  )) OR
  -- Public can complete their own signing
  (status = 'pending')
) WITH CHECK (
  -- Document owners can update to any status
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signers.document_id 
    AND documents.user_id = auth.uid()
  )) OR
  -- Public can only update to completed/declined
  (status IN ('completed', 'declined'))
);

-- Signers delete policy (only document owners)
DROP POLICY IF EXISTS "signers_delete_policy" ON public.signers;
CREATE POLICY "signers_delete_policy" ON public.signers 
FOR DELETE USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signers.document_id 
    AND documents.user_id = auth.uid()
  )
);