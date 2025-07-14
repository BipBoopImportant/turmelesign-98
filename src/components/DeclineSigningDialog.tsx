
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';

interface DeclineSigningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  signerEmail: string;
  onDeclined: () => void;
  onDeclineAction?: (documentId: string, signerEmail: string, reason?: string) => Promise<boolean>;
}

export const DeclineSigningDialog: React.FC<DeclineSigningDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  signerEmail,
  onDeclined,
  onDeclineAction
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleDecline = async () => {
    setIsSubmitting(true);
    
    try {
      if (onDeclineAction) {
        // Use the provided decline action (preferred)
        const success = await onDeclineAction(documentId, signerEmail, reason);
        if (success) {
          onDeclined();
          onOpenChange(false);
          setReason('');
        }
      } else {
        // Fallback to direct database update
        const { error: signerError } = await supabase
          .from('signers')
          .update({
            status: 'declined',
            signed_at: new Date().toISOString(),
            signature_data: reason || 'Declined without reason'
          })
          .eq('document_id', documentId)
          .eq('email', signerEmail);

        if (signerError) throw signerError;

        toast({
          title: t('decline.documentDeclined'),
          description: t('decline.documentDeclinedDescription')
        });

        onDeclined();
        onOpenChange(false);
        setReason('');
      }
    } catch (error: any) {
      console.error('Decline error:', error);
      toast({
        title: t('decline.errorDeclining'),
        description: error.message || t('decline.failedToDecline'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-500" />
            {t('decline.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('decline.message')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">{t('decline.reasonLabel')}</Label>
            <Textarea
              id="reason"
              placeholder={t('decline.reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason('')}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDecline}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? t('decline.declining') : t('decline.declineToSign')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
