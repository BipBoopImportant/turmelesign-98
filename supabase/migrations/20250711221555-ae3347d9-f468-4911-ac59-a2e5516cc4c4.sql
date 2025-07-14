
-- Drop existing tables and recreate with proper structure
DROP TABLE IF EXISTS public.signature_fields CASCADE;
DROP TABLE IF EXISTS public.signers CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'completed')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create signers table
CREATE TABLE public.signers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  signature_data TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create signature_fields table
CREATE TABLE public.signature_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'signature' CHECK (type IN ('signature', 'initial', 'date', 'text')),
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  page INTEGER NOT NULL DEFAULT 1,
  signer_email TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  value TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_signers_document_id ON public.signers(document_id);
CREATE INDEX idx_signers_email ON public.signers(email);
CREATE INDEX idx_signature_fields_document_id ON public.signature_fields(document_id);
CREATE INDEX idx_signature_fields_signer_email ON public.signature_fields(signer_email);

-- Add RLS policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_fields ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (user_id = auth.uid());

-- Signers policies (document owners can manage signers)
CREATE POLICY "Document owners can view signers" ON public.signers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signers.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can insert signers" ON public.signers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signers.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can update signers" ON public.signers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signers.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can delete signers" ON public.signers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signers.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Signature fields policies (document owners can manage fields)
CREATE POLICY "Document owners can view signature fields" ON public.signature_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signature_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can insert signature fields" ON public.signature_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signature_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can update signature fields" ON public.signature_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signature_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can delete signature fields" ON public.signature_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signature_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to automatically complete document when all signers are done
CREATE OR REPLACE FUNCTION public.check_document_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all signers for this document are completed
  IF NOT EXISTS (
    SELECT 1 FROM public.signers 
    WHERE document_id = NEW.document_id 
    AND status = 'pending'
  ) THEN
    -- Update document status to completed
    UPDATE public.documents 
    SET status = 'completed', completed_at = now()
    WHERE id = NEW.document_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_completion_after_signer_update
  AFTER UPDATE ON public.signers
  FOR EACH ROW 
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.check_document_completion();
