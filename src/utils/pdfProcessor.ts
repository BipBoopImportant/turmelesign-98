
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { renderSignatureOnPdf } from './signatureRenderer';

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

export const processSignatureField = async (
  page: any,
  field: SignatureField,
  signedField: any,
  signer: any,
  pageWidth: number,
  pageHeight: number,
  pdfDoc: PDFDocument,
  helveticaFont: any,
  helveticaBoldFont: any
) => {
  return renderSignatureOnPdf(
    page,
    field,
    signedField,
    signer,
    pageWidth,
    pageHeight,
    pdfDoc,
    helveticaFont,
    helveticaBoldFont
  );
};
