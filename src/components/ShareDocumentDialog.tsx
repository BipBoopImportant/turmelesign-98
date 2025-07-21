import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Copy, 
  QrCode, 
  Mail, 
  ExternalLink,
  Check,
  Download,
  Send
} from 'lucide-react';
import QRCode from 'qrcode';

interface Signer {
  id: string;
  name: string;
  email: string;
  color?: string;
  status: string;
}

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  signers: Signer[];
}

export const ShareDocumentDialog: React.FC<ShareDocumentDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  documentName,
  signers: propSigners
}) => {
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());
  const [qrCodes, setQrCodes] = useState<Map<string, string>>(new Map());
  const [generatingQR, setGeneratingQR] = useState(false);
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());
  const [emailMessage, setEmailMessage] = useState('');
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Fetch fresh signer data when dialog opens
  const { data: freshSignersData } = useQuery({
    queryKey: ['document-signers', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      
      const { data, error } = await supabase
        .from('signers')
        .select('*')
        .eq('document_id', documentId)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      // Remove duplicates by email and keep the latest created record
      const uniqueSigners = data ? 
        data.reduce((acc, signer) => {
          const existing = acc.find(s => s.email === signer.email);
          if (!existing || new Date(signer.created_at) > new Date(existing.created_at)) {
            // Remove existing signer with same email if found
            const filtered = acc.filter(s => s.email !== signer.email);
            return [...filtered, signer];
          }
          return acc;
        }, [] as typeof data) : [];
      
      return uniqueSigners.map(signer => ({
        ...signer,
        color: '#3B82F6' // Add default color
      }));
    },
    enabled: open && !!documentId
  });

  // Memoize signers to prevent infinite loops - filter for pending and deduplicate
  const signers = useMemo(() => {
    const signersData = freshSignersData || propSigners.filter(s => s.status === 'pending');
    
    // Further deduplicate in case propSigners has duplicates
    const uniqueSigners = signersData.reduce((acc, signer) => {
      const existing = acc.find(s => s.email === signer.email);
      if (!existing) {
        return [...acc, { ...signer, color: signer.color || '#3B82F6' }];
      }
      return acc;
    }, [] as Signer[]);
    
    console.log(`ShareDocumentDialog: Showing ${uniqueSigners.length} unique pending signers`);
    return uniqueSigners;
  }, [freshSignersData, propSigners]);

  // Memoize signer emails to prevent effect re-runs
  const signerEmails = useMemo(() => {
    return signers.map(s => s.email).sort().join(',');
  }, [signers]);

  const generateSigningLink = (signerEmail: string) => {
    const encodedEmail = encodeURIComponent(signerEmail);
    return `${window.location.origin}/sign/${documentId}/${encodedEmail}`;
  };

  const generateQRCode = async (signerEmail: string) => {
    try {
      const link = generateSigningLink(signerEmail);
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  // Generate QR codes with proper dependency management
  useEffect(() => {
    if (!open || signers.length === 0 || generatingQR) return;

    const generateAllQRCodes = async () => {
      setGeneratingQR(true);
      const newQrCodes = new Map();
      
      try {
        for (const signer of signers) {
          // Check if QR code already exists
          if (!qrCodes.has(signer.email)) {
            const qrCode = await generateQRCode(signer.email);
            if (qrCode) {
              newQrCodes.set(signer.email, qrCode);
            }
          } else {
            // Keep existing QR code
            newQrCodes.set(signer.email, qrCodes.get(signer.email));
          }
        }
        
        setQrCodes(newQrCodes);
      } catch (error) {
        console.error('Error generating QR codes:', error);
      } finally {
        setGeneratingQR(false);
      }
    };

    generateAllQRCodes();
  }, [open, signerEmails, documentId]); // Use signerEmails instead of signers array

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setCopiedLinks(new Set());
      setQrCodes(new Map());
      setGeneratingQR(false);
    }
  }, [open]);

  const copyToClipboard = async (text: string, signerEmail: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinks(prev => new Set(prev).add(signerEmail));
      
      toast({
        title: t('share.linkCopied'),
        description: t('share.linkCopiedDescription')
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(signerEmail);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast({
        title: t('share.copyFailed'),
        description: t('share.copyFailedDescription'),
        variant: "destructive"
      });
    }
  };

  const downloadQRCode = (signerEmail: string, signerName: string) => {
    const qrCode = qrCodes.get(signerEmail);
    if (!qrCode) return;

    const link = document.createElement('a');
    link.download = `${signerName.replace(/\s+/g, '_')}_QR_Code.png`;
    link.href = qrCode;
    link.click();
  };

  const openSigningLink = (signerEmail: string) => {
    const link = generateSigningLink(signerEmail);
    window.open(link, '_blank');
  };

  const sendSigningEmail = async (signer: Signer) => {
    setSendingEmails(prev => new Set(prev).add(signer.email));
    
    try {
      console.log('Starting email send process for:', signer.email);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('Session obtained, calling edge function...');
      console.log('Function URL will be:', `https://rqbypmoxcvtiljwctwlq.supabase.co/functions/v1/send-signing-email`);

      const response = await supabase.functions.invoke('send-signing-email', {
        body: {
          documentId,
          signerEmail: signer.email,
          signerName: signer.name,
          documentName,
          message: emailMessage.trim() || undefined,
          language
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Edge function response:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(response.error.message || 'Failed to send email');
      }

      if (response.data?.error) {
        console.error('Email sending error:', response.data.error);
        throw new Error(response.data.error || 'Failed to send email');
      }

      console.log('Email sent successfully');
      toast({
        title: t('share.emailSent'),
        description: `${t('share.emailSentDescription').replace('{name}', signer.name)}`,
      });

    } catch (error: any) {
      console.error('Error sending email:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send signing invitation",
        variant: "destructive",
      });
    } finally {
      setSendingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(signer.email);
        return newSet;
      });
    }
  };

  // Don't show dialog if no pending signers
  if (signers.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('share.title')}</DialogTitle>
          <DialogDescription>
            {t('share.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Message Input */}
          <div className="space-y-2">
            <Label htmlFor="email-message">{t('share.emailMessage')}</Label>
            <Textarea
              id="email-message"
              placeholder={t('share.emailMessagePlaceholder')}
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {signers.map((signer) => {
            const signingLink = generateSigningLink(signer.email);
            const qrCode = qrCodes.get(signer.email);
            const isCopied = copiedLinks.has(signer.email);
            const isSendingEmail = sendingEmails.has(signer.email);

            return (
              <Card key={signer.id} className="p-4">
                <div className="space-y-4">
                  {/* Signer Info */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: signer.color }}
                    />
                    <div>
                      <h3 className="font-medium">{signer.name}</h3>
                      <p className="text-sm text-muted-foreground">{signer.email}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {t('share.pending')}
                    </Badge>
                  </div>

                  {/* Signing Link */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('share.signingLink')}</label>
                    <div className="flex gap-2">
                      <Input
                        value={signingLink}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(signingLink, signer.email)}
                        className="shrink-0"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openSigningLink(signer.email)}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sendSigningEmail(signer)}
                        disabled={isSendingEmail}
                        className="shrink-0"
                      >
                        {isSendingEmail ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Email
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* QR Code */}
                  {qrCode ? (
                    <div className="flex gap-4 items-start">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('share.qrCode')}</label>
                        <div className="border rounded-lg p-2 bg-white">
                          <img
                            src={qrCode}
                            alt={`QR Code for ${signer.name}`}
                            className="w-32 h-32"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2 flex-1">
                        <p className="text-sm text-muted-foreground">
                          {t('share.showQRCode')} <strong>{signer.name}</strong> {t('share.forEasyAccess')}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQRCode(signer.email, signer.name)}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            {t('common.download')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : generatingQR ? (
                    <div className="text-sm text-muted-foreground">
                      {t('share.generatingQR')}
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)}>
              {t('share.done')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
