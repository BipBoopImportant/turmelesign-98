-- Fix infinite recursion in signers RLS policies
DROP POLICY IF EXISTS "signers_owner_access" ON public.signers;
DROP POLICY IF EXISTS "signers_public_view" ON public.signers;
DROP POLICY IF EXISTS "signers_public_update" ON public.signers;

-- Create security definer function to check if document has pending signers
CREATE OR REPLACE FUNCTION public.document_has_pending_signers(doc_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.signers 
    WHERE document_id = doc_id 
    AND status = 'pending'
  );
$$;

-- Create security definer function to check if user is pending signer for document
CREATE OR REPLACE FUNCTION public.is_pending_signer_for_document(doc_id uuid, signer_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.signers 
    WHERE document_id = doc_id 
    AND email = signer_email 
    AND status = 'pending'
  );
$$;

-- Document owners can access all signers for their documents
CREATE POLICY "signers_owner_access" ON public.signers 
FOR ALL USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signers.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Public users can view signers for documents they are signing
CREATE POLICY "signers_public_view" ON public.signers 
FOR SELECT USING (
  public.document_has_pending_signers(document_id)
);

-- Public users can update their own signer status when they are pending signers
CREATE POLICY "signers_public_update" ON public.signers 
FOR UPDATE USING (
  public.is_pending_signer_for_document(document_id, email) AND status = 'pending'
) WITH CHECK (
  status IN ('completed', 'declined')
);