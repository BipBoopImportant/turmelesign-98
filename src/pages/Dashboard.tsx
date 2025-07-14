
import React, { useState } from 'react';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentStatusDialog } from '@/components/DocumentStatusDialog';
import { ShareDocumentDialog } from '@/components/ShareDocumentDialog';
import { DeleteDocumentDialog } from '@/components/DeleteDocumentDialog';
import { DashboardHeader } from '@/components/Dashboard/DashboardHeader';
import { DocumentCard } from '@/components/Dashboard/DocumentCard';
import { LoadingGrid } from '@/components/Dashboard/LoadingGrid';
import { EmptyState } from '@/components/Dashboard/EmptyState';
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [shareDocumentId, setShareDocumentId] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);

  const { documentsWithDetails, isLoading, isLoadingDetails, refetch } = useDashboardData();

  const handleEditDocument = (documentId: string) => {
    window.location.href = `/editor/${documentId}`;
  };

  const handleViewStatus = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

  const handleDeleteDocument = (documentId: string, documentName: string) => {
    setDocumentToDelete({ id: documentId, name: documentName });
  };

  const handleDocumentDeleted = () => {
    refetch();
    setDocumentToDelete(null);
  };

  const handleShareDocument = (documentId: string) => {
    setShareDocumentId(documentId);
  };

  const handleUploadClick = () => {
    setShowUpload(true);
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    refetch();
  };

  if (showUpload) {
    return (
      <DocumentUpload 
        onClose={() => setShowUpload(false)}
        onUpload={handleUploadComplete}
      />
    );
  }

  const isLoadingData = isLoading || isLoadingDetails;
  const displayDocuments = documentsWithDetails || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader onUploadClick={handleUploadClick} />

        {isLoadingData ? (
          <LoadingGrid />
        ) : displayDocuments.length === 0 ? (
          <EmptyState onUploadClick={handleUploadClick} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onViewStatus={handleViewStatus}
                onShareDocument={handleShareDocument}
                onEditDocument={handleEditDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            ))}
          </div>
        )}
      </div>

      <DocumentStatusDialog
        documentId={selectedDocumentId}
        open={!!selectedDocumentId}
        onOpenChange={() => setSelectedDocumentId(null)}
      />

      <ShareDocumentDialog
        documentId={shareDocumentId || ''}
        documentName={displayDocuments.find(doc => doc.id === shareDocumentId)?.name || 'Document'}
        open={!!shareDocumentId}
        onOpenChange={() => setShareDocumentId(null)}
        signers={displayDocuments.find(doc => doc.id === shareDocumentId)?.signers?.filter(s => s.status === 'pending') || []}
      />

      <DeleteDocumentDialog
        open={!!documentToDelete}
        onOpenChange={() => setDocumentToDelete(null)}
        documentId={documentToDelete?.id || ''}
        documentName={documentToDelete?.name || ''}
        onDeleted={handleDocumentDeleted}
      />
    </div>
  );
};

export default Dashboard;
