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
  signed: boolean;
  signer_email: string;
}

export interface Signer {
  id: string;
  name: string;
  email: string;
  color: string;
  status: string;
}

export interface DocumentEditorProps {
  documentId: string;
  onClose: () => void;
}
