import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Mail, 
  Calendar,
  FileText,
  AlertCircle,
  Users
} from 'lucide-react';
import { format } from 'date-fns';

interface DocumentStatusDialogProps {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentStatusDialog: React.FC<DocumentStatusDialogProps> = ({
  documentId,
  open,
  onOpenChange
}) => {
  const { t } = useLanguage();
  const { data: documentDetails, isLoading } = useQuery({
    queryKey: ['document-status', documentId],
    queryFn: async () => {
      if (!documentId) return null;

      // Get document details
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      // Get signers with their status
      const { data: signers, error: signersError } = await supabase
        .from('signers')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (signersError) throw signersError;

      // Get signature fields
      const { data: fields, error: fieldsError } = await supabase
        .from('signature_fields')
        .select('*')
        .eq('document_id', documentId);

      if (fieldsError) throw fieldsError;

      // Get signed fields count per signer
      const signersWithProgress = await Promise.all(
        (signers || []).map(async (signer) => {
          const signerFields = fields?.filter(f => f.signer_email === signer.email) || [];
          const signedFields = signerFields.filter(f => f.value !== null);
          
          return {
            ...signer,
            totalFields: signerFields.length,
            signedFields: signedFields.length,
            progress: signerFields.length > 0 ? (signedFields.length / signerFields.length) * 100 : 0
          };
        })
      );

      return {
        document,
        signers: signersWithProgress,
        totalFields: fields?.length || 0,
        signedFields: fields?.filter(f => f.value !== null).length || 0
      };
    },
    enabled: !!documentId && open
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <AlertCircle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (!documentDetails && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('status.documentStatus')}
          </DialogTitle>
          <DialogDescription>
            {t('status.viewProgress')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : documentDetails ? (
          <div className="space-y-6">
            {/* Document Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{documentDetails.document.name}</span>
                  <Badge className={`${getStatusColor(documentDetails.document.status)} text-white`}>
                    {documentDetails.document.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{t('document.created')}: {format(new Date(documentDetails.document.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {documentDetails.document.completed_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{t('document.completed')}: {format(new Date(documentDetails.document.completed_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{documentDetails.signers.length} {t('status.signers')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{documentDetails.totalFields} {t('status.fields')} ({documentDetails.signedFields} {t('status.completed')})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signers Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('status.signersProgress')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentDetails.signers.map((signer) => (
                    <div key={signer.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{signer.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {signer.email}
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(signer.status)} text-white`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(signer.status)}
                            {signer.status}
                          </span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('status.progress')}</span>
                          <span>{signer.signedFields}/{signer.totalFields} {t('status.fieldsCompleted')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all" 
                            style={{ width: `${signer.progress}%` }}
                          ></div>
                        </div>
                        
                        {signer.signed_at && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{t('status.signedOn')} {format(new Date(signer.signed_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {documentDetails.signers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{t('status.noSigners')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
