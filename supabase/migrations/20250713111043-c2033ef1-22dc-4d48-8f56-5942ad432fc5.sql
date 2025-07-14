-- Restore document owner access while keeping public signing access
-- Document owners should always be able to see their own documents
CREATE POLICY "Document owners can view their documents" 
ON public.documents 
FOR SELECT 
USING (user_id = auth.uid());

-- Keep the public signing access for pending signers as well
-- (This policy already exists from the previous migration, but ensuring it's clear)
-- The "Public can view documents for pending signers" policy allows signees to view documents
-- while their status is pending, and this new policy allows owners to always see their documents