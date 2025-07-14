-- Clean up all existing policies and recreate them properly
-- This ensures document owners can manage their documents and signees can access documents through signing links

-- Drop all existing policies
DROP POLICY IF EXISTS "documents_access_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_update_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON public.documents;
DROP POLICY IF EXISTS "Document owners can view their documents" ON public.documents;
DROP POLICY IF EXISTS "Public can view documents for pending signers" ON public.documents;

-- Documents policies
-- 1. Document owners can always access their documents
CREATE POLICY "owners_full_access" ON public.documents 
FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 2. Public can view documents only if they have pending signers (for signing links)
CREATE POLICY "public_signing_access" ON public.documents 
FOR SELECT USING (
  status IN ('sent', 'completed') AND
  EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = documents.id 
    AND signers.status = 'pending'
  )
);

-- Clean up signers policies
DROP POLICY IF EXISTS "signers_access_policy" ON public.signers;
DROP POLICY IF EXISTS "signers_insert_policy" ON public.signers;
DROP POLICY IF EXISTS "signers_update_policy" ON public.signers;
DROP POLICY IF EXISTS "signers_delete_policy" ON public.signers;
DROP POLICY IF EXISTS "Public can view own pending signer record" ON public.signers;
DROP POLICY IF EXISTS "Public can complete own signing" ON public.signers;

-- Signers policies
-- 1. Document owners can manage all signers for their documents
CREATE POLICY "owners_manage_signers" ON public.signers 
FOR ALL USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signers.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- 2. Public can view and update their own pending signer records
CREATE POLICY "public_signer_access" ON public.signers 
FOR SELECT USING (status = 'pending');

CREATE POLICY "public_signer_update" ON public.signers 
FOR UPDATE USING (status = 'pending')
WITH CHECK (status IN ('completed', 'declined'));

-- Clean up signature fields policies
DROP POLICY IF EXISTS "signature_fields_select_policy" ON public.signature_fields;
DROP POLICY IF EXISTS "signature_fields_insert_policy" ON public.signature_fields;
DROP POLICY IF EXISTS "signature_fields_update_policy" ON public.signature_fields;
DROP POLICY IF EXISTS "signature_fields_delete_policy" ON public.signature_fields;
DROP POLICY IF EXISTS "Public can view signature fields for pending signers" ON public.signature_fields;
DROP POLICY IF EXISTS "Public can update signature fields for pending signers" ON public.signature_fields;

-- Signature fields policies
-- 1. Document owners can manage all signature fields for their documents
CREATE POLICY "owners_manage_fields" ON public.signature_fields 
FOR ALL USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = signature_fields.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- 2. Public can view and update signature fields only if they have pending access
CREATE POLICY "public_fields_access" ON public.signature_fields 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = signature_fields.document_id 
    AND signers.email = signature_fields.signer_email 
    AND signers.status = 'pending'
  )
);

CREATE POLICY "public_fields_update" ON public.signature_fields 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = signature_fields.document_id 
    AND signers.email = signature_fields.signer_email 
    AND signers.status = 'pending'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.signers 
    WHERE signers.document_id = signature_fields.document_id 
    AND signers.email = signature_fields.signer_email 
    AND signers.status = 'pending'
  )
);

-- Update storage policies for document access
DROP POLICY IF EXISTS "Public can view documents for pending signers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents for signing" ON storage.objects;

-- Storage policy for document owners
CREATE POLICY "owners_access_files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.file_url = storage.objects.name 
    AND documents.user_id = auth.uid()
  )
);

-- Storage policy for public signing access
CREATE POLICY "public_signing_files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.documents 
    INNER JOIN public.signers ON signers.document_id = documents.id
    WHERE documents.file_url = storage.objects.name 
    AND documents.status IN ('sent', 'completed')
    AND signers.status = 'pending'
  )
);

-- Allow document owners to upload files
CREATE POLICY "owners_upload_files" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);