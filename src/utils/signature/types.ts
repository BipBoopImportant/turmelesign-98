export interface SignatureField {
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

export interface RenderContext {
  page: any;
  field: SignatureField;
  signedField: any;
  signer: any;
  pageWidth: number;
  pageHeight: number;
  pdfDoc: any;
  helveticaFont: any;
  helveticaBoldFont: any;
}

export interface AspectRatioResult {
  x: number;
  y: number;
  width: number;
  height: number;
}