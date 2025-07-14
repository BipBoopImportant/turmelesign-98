import { PDFDocument } from 'pdf-lib';
import { renderSignatureField } from './signatureRenderer';
import { renderDateField, renderTextField } from './textFieldRenderer';
import { SignatureField, RenderContext } from './types';

/**
 * Main entry point for rendering signature fields on PDF
 */
export const renderSignatureOnPdf = async (
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
  const context: RenderContext = {
    page,
    field,
    signedField,
    signer,
    pageWidth,
    pageHeight,
    pdfDoc,
    helveticaFont,
    helveticaBoldFont
  };

  switch (field.type) {
    case 'signature':
    case 'initial':
      await renderSignatureField(context);
      break;
    case 'date':
      renderDateField(context);
      break;
    case 'text':
      renderTextField(context);
      break;
    default:
      console.warn(`Unknown field type: ${field.type}`);
  }
};

/**
 * Reset signature tracking (call this when starting a new document)
 */
export const resetSignatureTracking = () => {
  console.log('Reset signature tracking for new document');
};