
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trash2 } from 'lucide-react';

interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  onDeleted: () => void;
}

export const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  documentName,
  onDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Get document file URL for cleanup
      const { data: document } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      // Delete document (this will cascade delete signers and signature_fields)
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      // Clean up file from storage if it exists
      if (document?.file_url) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([document.file_url]);
        
        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
        }
      }

      toast({
        title: t('delete.documentDeleted'),
        description: t('delete.permanentlyDeleted').replace('{name}', documentName)
      });

      onDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: t('delete.errorDeleting'),
        description: error.message || t('delete.failedToDelete'),
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            {t('delete.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete.confirmMessage').replace('{name}', documentName)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('delete.keepDocument')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? t('delete.deleting') : t('delete.deleteForever')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
