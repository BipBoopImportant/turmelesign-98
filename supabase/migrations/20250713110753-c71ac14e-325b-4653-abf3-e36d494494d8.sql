-- Enhanced security policies for public signing access
-- Ensures signees can only access their specific documents and fields through signing links
-- Prevents access after completion

-- Update signers policies to be more restrictive
DROP POLICY IF EXISTS "Public can view signers for signing" ON public.signers;
DROP POLICY IF EXISTS "Public can update signer status for signing" ON public.signers;

-- Signers can only view their own record if status is pending
CREATE POLICY "Public can view own pending signer record" 
ON public.signers 
FOR SELECT 
USING (status = 'pending');

-- Signers can only update their own status from pending to completed/declined
CREATE POLICY "Public can complete own signing" 
ON public.signers 
FOR UPDATE 
USING (status = 'pending')
WITH CHECK (status IN ('completed', 'declined'));

-- Update signature fields policies to be more restrictive
DROP POLICY IF EXISTS "Public can view signature fields for signing" ON public.signature_fields;
DROP POLICY IF EXISTS "Public can update signature fields for signing" ON public.signature_fields;

-- Signature fields can only be viewed if the signer is still pending
CREATE POLICY "Public can view signature fields for pending signers" 
ON public.signature_fields 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = signature_fields.document_id 
    AND signers.email = signature_fields.signer_email 
    AND signers.status = 'pending'
  )
);

-- Signature fields can only be updated if the signer is still pending
CREATE POLICY "Public can update signature fields for pending signers" 
ON public.signature_fields 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = signature_fields.document_id 
    AND signers.email = signature_fields.signer_email 
    AND signers.status = 'pending'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = signature_fields.document_id 
    AND signers.email = signature_fields.signer_email 
    AND signers.status = 'pending'
  )
);

-- Update documents policy to only allow viewing for pending signers
DROP POLICY IF EXISTS "Public can view documents for signing" ON public.documents;

-- Documents can only be viewed by pending signers
CREATE POLICY "Public can view documents for pending signers" 
ON public.documents 
FOR SELECT 
USING (
  status IN ('sent', 'completed') AND
  EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = documents.id 
    AND signers.status = 'pending'
  )
);

-- Update storage policies to be more restrictive
DROP POLICY IF EXISTS "Public can view documents for signing" ON storage.objects;

-- Storage objects can only be accessed by pending signers
CREATE POLICY "Public can view documents for pending signers" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.documents 
    INNER JOIN public.signers ON signers.document_id = documents.id
    WHERE documents.file_url = name 
    AND documents.status IN ('sent', 'completed')
    AND signers.status = 'pending'
  )
);