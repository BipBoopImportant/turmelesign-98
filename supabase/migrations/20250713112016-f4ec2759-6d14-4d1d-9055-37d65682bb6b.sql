-- Fix infinite recursion by using security definer functions
-- Remove all existing policies that cause circular dependencies

DROP POLICY IF EXISTS "owners_full_access" ON public.documents;
DROP POLICY IF EXISTS "public_signing_access" ON public.documents;
DROP POLICY IF EXISTS "owners_manage_signers" ON public.signers;
DROP POLICY IF EXISTS "public_signer_access" ON public.signers;
DROP POLICY IF EXISTS "public_signer_update" ON public.signers;
DROP POLICY IF EXISTS "owners_manage_fields" ON public.signature_fields;
DROP POLICY IF EXISTS "public_fields_access" ON public.signature_fields;
DROP POLICY IF EXISTS "public_fields_update" ON public.signature_fields;

-- Create security definer functions to avoid circular dependencies
CREATE OR REPLACE FUNCTION public.is_document_owner(document_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = document_id 
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_pending_signer(document_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.signers 
    WHERE document_id = has_pending_signer.document_id 
    AND status = 'pending'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pending_signer_for_field(field_document_id uuid, field_signer_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.signers 
    WHERE document_id = field_document_id 
    AND email = field_signer_email 
    AND status = 'pending'
  );
$$;

-- Simple, non-circular RLS policies using security definer functions

-- Documents policies
CREATE POLICY "document_owners_access" ON public.documents 
FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "public_document_signing" ON public.documents 
FOR SELECT USING (
  status IN ('sent', 'completed') AND
  public.has_pending_signer(id)
);

-- Signers policies
CREATE POLICY "signer_owners_access" ON public.signers 
FOR ALL USING (public.is_document_owner(document_id));

CREATE POLICY "public_pending_signer_view" ON public.signers 
FOR SELECT USING (status = 'pending');

CREATE POLICY "public_pending_signer_update" ON public.signers 
FOR UPDATE USING (status = 'pending')
WITH CHECK (status IN ('completed', 'declined'));

-- Signature fields policies
CREATE POLICY "field_owners_access" ON public.signature_fields 
FOR ALL USING (public.is_document_owner(document_id));

CREATE POLICY "public_pending_fields_view" ON public.signature_fields 
FOR SELECT USING (public.is_pending_signer_for_field(document_id, signer_email));

CREATE POLICY "public_pending_fields_update" ON public.signature_fields 
FOR UPDATE USING (public.is_pending_signer_for_field(document_id, signer_email))
WITH CHECK (public.is_pending_signer_for_field(document_id, signer_email));