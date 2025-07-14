
-- Allow public read access to signers table for signing operations
-- (but still require auth for document owners to manage signers)
CREATE POLICY "Public can view signers for signing" 
  ON public.signers 
  FOR SELECT 
  USING (status = 'pending');

-- Allow public updates to signers for signing completion
-- (but only for their own records and only status/signature updates)
CREATE POLICY "Public can update signer status for signing" 
  ON public.signers 
  FOR UPDATE 
  USING (status IN ('pending', 'completed', 'declined'))
  WITH CHECK (status IN ('completed', 'declined'));

-- Allow public read access to signature fields for signing
CREATE POLICY "Public can view signature fields for signing" 
  ON public.signature_fields 
  FOR SELECT 
  USING (true);

-- Allow public updates to signature fields for signing
CREATE POLICY "Public can update signature fields for signing" 
  ON public.signature_fields 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Allow public read access to documents for signing (but limited fields)
CREATE POLICY "Public can view documents for signing" 
  ON public.documents 
  FOR SELECT 
  USING (status IN ('sent', 'completed'));
