import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { processSignatureField } from '@/utils/pdfProcessor';
import { resetSignatureTracking } from '@/utils/signatureRenderer';
interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  signerEmail: string;
  required: boolean;
  value?: string;
}
interface Signer {
  id: string;
  name: string;
  email: string;
  color: string;
  signatureData?: string;
}
interface DocumentDownloaderProps {
  documentId: string;
  documentUrl: string;
  fields: SignatureField[];
  signers: Signer[];
  documentName: string;
}
export const DocumentDownloader: React.FC<DocumentDownloaderProps> = ({
  documentId,
  documentUrl,
  fields,
  signers,
  documentName
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const {
    toast
  } = useToast();
  const {
    t
  } = useLanguage();
  const downloadFinalDocument = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(documentUrl);
      const arrayBuffer = await response.arrayBuffer();
      const {
        PDFDocument,
        StandardFonts
      } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const {
        data: signedFields
      } = await supabase.from('signature_fields').select('*').eq('document_id', documentId).not('value', 'is', null);
      const {
        data: signersData
      } = await supabase.from('signers').select('*').eq('document_id', documentId);
      
      // Reset signature tracking for new document
      resetSignatureTracking();
      console.log('Processing fields for download:', fields.length);
      for (const field of fields) {
        const signedField = signedFields?.find(sf => sf.id === field.id);
        const signer = signersData?.find(s => s.email === field.signerEmail);
        if (!signedField?.value && !signer?.signature_data) continue;
        const page = pages[field.page - 1];
        if (!page) continue;
        const {
          width: pageWidth,
          height: pageHeight
        } = page.getSize();
        await processSignatureField(page, field, signedField, signer, pageWidth, pageHeight, pdfDoc, helveticaFont, helveticaBoldFont);
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], {
        type: 'application/pdf'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentName}_signed.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: t('downloader.downloadComplete'),
        description: t('downloader.downloadCompleteDescription')
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: t('downloader.downloadFailed'),
        description: error.message || t('downloader.downloadFailedDescription'),
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };
  return <Button onClick={downloadFinalDocument} disabled={isDownloading} size="sm" variant="outline" className="flex-1 flex items-center gap-1 text-xs leading-tight px-2 text-slate-50 bg-stone-950 hover:bg-stone-800">
      {isDownloading ? <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          {t('downloader.generating')}
        </> : <>
          <Download className="h-4 w-4" />
          {t('downloader.downloadFinalDocument')}
        </>}
    </Button>;
};