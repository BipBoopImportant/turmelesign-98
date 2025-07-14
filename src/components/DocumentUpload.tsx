
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, File, X, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface DocumentUploadProps {
  onClose: () => void;
  onUpload: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: t('upload.invalidFileType'),
        description: t('upload.pdfOnlyError'),
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
    if (!documentName) {
      setDocumentName(selectedFile.name.replace('.pdf', ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentName.trim()) {
      toast({
        title: t('upload.missingInfo'),
        description: t('upload.selectFileAndName'),
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: documentName.trim(),
          file_url: uploadData.path,
          user_id: user.id,
          status: 'draft'
        });

      if (dbError) throw dbError;

      toast({
        title: t('upload.success'),
        description: t('upload.uploadedSuccessfully')
      });

      onUpload();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: t('upload.uploadFailed'),
        description: error.message || t('upload.failedToUpload'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('upload.title')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('upload.documentDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="documentName">{t('upload.documentName')}</Label>
              <Input
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder={t('upload.enterDocumentName')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('upload.uploadPDFFile')}</Label>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <File className="h-12 w-12 mx-auto text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="font-medium">{t('upload.dropHere')}</p>
                    <p className="text-sm text-muted-foreground">{t('upload.pdfOnly')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || !documentName.trim() || uploading}
                className="flex-1"
              >
                {uploading ? (
                  t('upload.uploading')
                ) : (
                  <>
                    {t('upload.continueToEditor')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
