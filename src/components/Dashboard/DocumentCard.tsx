import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Users, FileText, Eye, Share, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentDownloader } from '@/components/DocumentDownloader';
import { useLanguage } from '@/contexts/LanguageContext';
interface DocumentCardProps {
  document: {
    id: string;
    name: string;
    status: string;
    created_at: string;
    completed_at?: string;
    signers?: Array<{
      id: string;
      name: string;
      email: string;
      color: string;
      status: string;
    }>;
    fields?: Array<{
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
    }>;
    signedCount: number;
    declinedCount?: number;
    totalSigners: number;
    totalFields: number;
    documentUrl?: string;
  };
  onViewStatus: (documentId: string) => void;
  onShareDocument: (documentId: string) => void;
  onEditDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string, documentName: string) => void;
}
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-500';
    case 'sent':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-500';
    case 'declined':
      return 'bg-red-500';
    case 'partially_declined':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft':
      return <FileText className="h-4 w-4" />;
    case 'sent':
      return <Clock className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'declined':
      return <X className="h-4 w-4" />;
    case 'partially_declined':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};
export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  onViewStatus,
  onShareDocument,
  onEditDocument,
  onDeleteDocument
}) => {
  const {
    t
  } = useLanguage();
  const hasActiveSigners = doc.signers?.some(signer => signer.status === 'pending') || false;
  return <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{doc.name}</span>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(doc.status)} text-white`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(doc.status)}
                {doc.status}
              </span>
            </Badge>
            <Button onClick={() => onDeleteDocument(doc.id, doc.name)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title={t('document.deleteDocument')}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('document.created')} {format(new Date(doc.created_at), 'MMM d, yyyy')}
          </div>
          {doc.completed_at && <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t('document.completed')} {format(new Date(doc.completed_at), 'MMM d, yyyy')}
            </div>}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {doc.signedCount || 0}/{doc.totalSigners || 0} {t('document.signed')}
            {doc.signers?.some(s => s.status === 'declined') && <span className="text-red-600 text-xs">
                ({doc.signers.filter(s => s.status === 'declined').length} {t('document.declined')})
              </span>}
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {doc.totalFields || 0} {t('document.signatureFields')}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => onViewStatus(doc.id)} variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            {t('document.viewStatus')}
          </Button>
          
          {hasActiveSigners && <Button onClick={() => onShareDocument(doc.id)} variant="outline" size="sm" className="flex-1 text-slate-50 bg-stone-950 hover:bg-stone-800">
              <Share className="h-4 w-4 mr-2" />
              {t('document.shareLinks')}
            </Button>}
          
          {doc.status === 'draft' && <Button onClick={() => onEditDocument(doc.id)} variant="outline" size="sm" className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              {t('document.edit')}
            </Button>}
          
          {doc.status === 'completed' && doc.documentUrl && <DocumentDownloader documentId={doc.id} documentUrl={doc.documentUrl} fields={doc.fields || []} signers={doc.signers || []} documentName={doc.name} />}
        </div>
      </CardContent>
    </Card>;
};