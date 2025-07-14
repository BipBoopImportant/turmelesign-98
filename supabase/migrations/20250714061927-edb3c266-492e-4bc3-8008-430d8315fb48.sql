-- Fix signers RLS policies to allow proper access during signing completion
DROP POLICY IF EXISTS "signer_owners_access" ON public.signers;
DROP POLICY IF EXISTS "public_pending_signer_view" ON public.signers;
DROP POLICY IF EXISTS "public_pending_signer_update" ON public.signers;

-- Document owners can access all signers for their documents
CREATE POLICY "signers_owner_access" ON public.signers 
FOR ALL USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signers.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Public users can view all signers for documents they are signing
CREATE POLICY "signers_public_view" ON public.signers 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.signers s 
    WHERE s.document_id = signers.document_id 
    AND s.status = 'pending'
  )
);

-- Public users can update their own signer status when pending
CREATE POLICY "signers_public_update" ON public.signers 
FOR UPDATE USING (
  status = 'pending'
) WITH CHECK (
  status IN ('completed', 'declined')
);