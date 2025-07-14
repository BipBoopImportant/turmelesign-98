
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Signer, SignatureField } from '@/types/document';

interface SignerManagerProps {
  signers: Signer[];
  fields: SignatureField[];
  selectedSigner: string;
  onSignersChange: (signers: Signer[]) => void;
  onSelectedSignerChange: (signerId: string) => void;
  previewMode: boolean;
  signerColors: string[];
}

export const SignerManager: React.FC<SignerManagerProps> = ({
  signers,
  fields,
  selectedSigner,
  onSignersChange,
  onSelectedSignerChange,
  previewMode,
  signerColors
}) => {
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();

  const addSigner = () => {
    if (!newSignerName.trim() || !newSignerEmail.trim()) {
      toast({
        title: t('signers.missingInfo'),
        description: t('signers.enterNameAndEmail'),
        variant: "destructive"
      });
      return;
    }

    const emailToCheck = newSignerEmail.trim().toLowerCase();
    
    // Check for exact duplicate emails (case-insensitive)
    if (signers.find(s => s.email.toLowerCase() === emailToCheck)) {
      toast({
        title: t('signers.duplicateEmail'),
        description: t('signers.emailExists'),
        variant: "destructive"
      });
      return;
    }

    const newSigner: Signer = {
      id: Date.now().toString(),
      name: newSignerName.trim(),
      email: emailToCheck,
      color: signerColors[signers.length % signerColors.length],
      status: 'pending'
    };

    const updatedSigners = [...signers, newSigner];
    onSignersChange(updatedSigners);
    setNewSignerName('');
    setNewSignerEmail('');
    setShowAddSigner(false);
    
    if (!selectedSigner) {
      onSelectedSignerChange(newSigner.id);
    }

    toast({
      title: t('signers.signerAdded'),
      description: t('signers.signerAddedDescription').replace('{name}', newSigner.name)
    });
  };

  const removeSigner = (signerId: string) => {
    const signerToRemove = signers.find(s => s.id === signerId);
    if (!signerToRemove) return;

    const updatedSigners = signers.filter(s => s.id !== signerId);
    onSignersChange(updatedSigners);
    
    if (selectedSigner === signerId) {
      onSelectedSignerChange(updatedSigners.length > 0 ? updatedSigners[0].id : '');
    }

    toast({
      title: t('signers.signerRemoved'),
      description: t('signers.signerRemovedDescription').replace('{name}', signerToRemove.name)
    });
  };

  const fieldsBySigner = signers.map(signer => ({
    signer,
    count: fields.filter(f => f.signerEmail === signer.email).length
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {t('signers.title')} ({signers.length})
          </CardTitle>
          {!previewMode && (
            <Button size="sm" variant="outline" onClick={() => setShowAddSigner(true)}>
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!previewMode && showAddSigner && (
          <div className="space-y-2 p-3 border rounded-lg bg-muted">
            <Input
              placeholder={t('signers.signerName')}
              value={newSignerName}
              onChange={(e) => setNewSignerName(e.target.value)}
            />
            <Input
              placeholder={t('signers.emailAddress')}
              type="email"
              value={newSignerEmail}
              onChange={(e) => setNewSignerEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addSigner}>{t('common.add')}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddSigner(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {fieldsBySigner.map(({ signer, count }) => (
          <div
            key={signer.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedSigner === signer.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            }`}
            onClick={() => !previewMode && onSelectedSignerChange(signer.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${signer.color}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{signer.name}</p>
                  <p className="text-xs text-muted-foreground">{signer.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {count} {count !== 1 ? t('editor.fields') : t('editor.field')}
                  </p>
                </div>
              </div>
              {!previewMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSigner(signer.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {signers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {previewMode ? t('signers.noSigners') : t('signers.addFirstSigner')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
