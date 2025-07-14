import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'fr-ca';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('turmel-language');
      return (stored as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    // Use requestIdleCallback or setTimeout to avoid blocking the main thread
    const updateStorage = () => {
      try {
        localStorage.setItem('turmel-language', language);
      } catch (error) {
        console.warn('Failed to save language preference:', error);
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(updateStorage);
    } else {
      setTimeout(updateStorage, 300);
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  en: {
    // Navigation
    'app.name': 'TurmelEsign',
    'nav.signOut': 'Sign Out',
    
    // Auth
    'auth.welcome': 'Welcome to TurmelEsign',
    'auth.subtitle': 'Sign documents electronically with ease',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.createPassword': 'Create a password',
    'auth.enterFullName': 'Enter your full name',
    'auth.signingIn': 'Signing in...',
    'auth.creatingAccount': 'Creating account...',
    'auth.createAccount': 'Create Account',
    'auth.success': 'Success!',
    'auth.checkEmail': 'Please check your email to confirm your account.',
    'auth.welcomeBack': 'Welcome back!',
    'auth.signedInSuccess': 'You have been signed in successfully.',
    'auth.signUpFailed': 'Sign up failed',
    'auth.signInFailed': 'Sign in failed',
    
    // Dashboard
    'dashboard.title': 'Document Dashboard',
    'dashboard.subtitle': 'Manage your documents and signatures',
    'dashboard.uploadDocument': 'Upload Document',
    'dashboard.noDocuments': 'No documents yet',
    'dashboard.uploadFirstDocument': 'Upload your first document to get started with electronic signatures.',
    'dashboard.getStarted': 'Get Started',
    
    // Document actions
    'document.viewStatus': 'View Status',
    'document.share': 'Share',
    'document.shareLinks': 'Share Links', 
    'document.edit': 'Edit',
    'document.delete': 'Delete',
    'document.download': 'Download',
    'document.created': 'Created',
    'document.completed': 'Completed',
    'document.signed': 'signed',
    'document.declined': 'declined',
    'document.signatureFields': 'signature fields',
    'document.deleteDocument': 'Delete document',
    
    // Document upload
    'upload.title': 'Upload Document',
    'upload.documentDetails': 'Document Details', 
    'upload.documentName': 'Document Name',
    'upload.enterDocumentName': 'Enter document name',
    'upload.uploadPDFFile': 'Upload PDF File',
    'upload.dropHere': 'Drop your PDF here or click to browse',
    'upload.pdfOnly': 'PDF files only, up to 50MB',
    'upload.invalidFileType': 'Invalid file type',
    'upload.pdfOnlyError': 'Please upload a PDF file only.',
    'upload.missingInfo': 'Missing information',
    'upload.selectFileAndName': 'Please select a file and enter a document name.',
    'upload.success': 'Success',
    'upload.uploadedSuccessfully': 'Document uploaded successfully!',
    'upload.uploadFailed': 'Upload failed',
    'upload.failedToUpload': 'Failed to upload document',
    'upload.uploading': 'Uploading...',
    'upload.continueToEditor': 'Continue to Editor',
    
    // Document status dialog
    'status.documentStatus': 'Document Status',
    'status.viewProgress': 'View the current status and progress of all signers for this document.',
    'status.signers': 'Signers',
    'status.fields': 'Fields',
    'status.completed': 'completed',
    'status.signersProgress': 'Signers Progress',
    'status.progress': 'Progress',
    'status.fieldsCompleted': 'fields completed',
    'status.signedOn': 'Signed on',
    'status.noSigners': 'No signers have been added to this document yet.',
    
    // Share document dialog
    'share.title': 'Share Document for Signing',
    'share.description': 'Share these personalized links with signers to allow them to sign the document. Each link becomes invalid once the signer completes or declines.',
    'share.pending': 'Pending',
    'share.signingLink': 'Signing Link',
    'share.qrCode': 'QR Code',
    'share.showQRCode': 'Show this QR code to',
    'share.forEasyAccess': 'for easy mobile access.',
    'share.generatingQR': 'Generating QR code...',
    'share.linkCopied': 'Link copied!',
    'share.linkCopiedDescription': 'Signing link has been copied to clipboard.',
    'share.copyFailed': 'Copy failed',
    'share.copyFailedDescription': 'Failed to copy link to clipboard.',
    'share.emailSent': 'Email Sent',
    'share.emailSentDescription': 'Signing invitation sent to {name}',
    'share.done': 'Done',
    
    // Delete document dialog
    'delete.title': 'Delete Document',
    'delete.confirmMessage': 'Are you sure you want to delete "{name}"? This action cannot be undone and will permanently remove the document and all associated signatures.',
    'delete.keepDocument': 'Keep Document',
    'delete.deleteForever': 'Delete Forever',
    'delete.deleting': 'Deleting...',
    'delete.documentDeleted': 'Document deleted',
    'delete.permanentlyDeleted': '"{name}" has been permanently deleted.',
    'delete.errorDeleting': 'Error deleting document',
    'delete.failedToDelete': 'Failed to delete document',
    
    // Signing interface
    'signing.signDocument': 'Sign Document',
    'signing.requiredRemaining': 'required remaining',
    'signing.declineToSign': 'Decline to Sign', 
    'signing.completeSigning': 'Complete Signing',
    'signing.clickFields': 'Click on any field in the document below to sign it.',
    'signing.completeRequired': 'Complete all {count} required fields to finish signing.',
    
    // Status badges
    'status.draft': 'draft',
    'status.sent': 'sent', 
    'status.statusCompleted': 'completed',
    'status.declined': 'declined',
    'status.pending': 'pending',
    'status.partially_declined': 'partially_declined',
    
    // Toasts
    'toast.signedOut': 'Signed out',
    'toast.signedOutSuccess': 'You have been signed out successfully.',
    'toast.signOutFailed': 'Sign out failed',
    
    // Common
    'common.loading': 'Loading...',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.share': 'Share',
    'common.upload': 'Upload',
    'common.download': 'Download',
    'common.add': 'Add',
    'common.clear': 'Clear',
    'common.apply': 'Apply',
    'common.next': 'Next',
    'common.previous': 'Previous',
    
    // Document Editor
    'editor.title': 'Document Editor',
    'editor.fields': 'fields',
    'editor.signers': 'signers',
    'editor.signer': 'signer',
    'editor.field': 'field',
    'editor.shareLinks': 'Share Links',
    'editor.editMode': 'Edit Mode',
    'editor.previewMode': 'Preview Mode',
    'editor.saving': 'Saving...',
    'editor.sendForSignature': 'Send for Signature',
    
    // Signer Manager
    'signers.title': 'Signers',
    'signers.add': 'Add',
    'signers.signerName': 'Signer name',
    'signers.emailAddress': 'Email address',
    'signers.missingInfo': 'Missing information',
    'signers.enterNameAndEmail': 'Please enter both name and email.',
    'signers.duplicateEmail': 'Duplicate email',
    'signers.emailExists': 'A signer with this email already exists.',
    'signers.signerAdded': 'Signer added',
    'signers.signerAddedDescription': '{name} has been added to the document.',
    'signers.signerRemoved': 'Signer removed',
    'signers.signerRemovedDescription': '{name} and their fields have been removed.',
    'signers.noSigners': 'No signers configured',
    'signers.addFirstSigner': 'Add your first signer to get started',
    
    // Decline Dialog
    'decline.title': 'Decline to Sign Document',
    'decline.message': 'Are you sure you want to decline signing this document? This action will notify the document owner and cannot be undone.',
    'decline.reasonLabel': 'Reason for declining (optional)',
    'decline.reasonPlaceholder': 'Please provide a reason for declining to sign...',
    'decline.declining': 'Declining...',
    'decline.declineToSign': 'Decline to Sign',
    'decline.documentDeclined': 'Document declined',
    'decline.documentDeclinedDescription': 'You have successfully declined to sign this document.',
    'decline.errorDeclining': 'Error declining document',
    'decline.failedToDecline': 'Failed to decline document',
    
    // Signing Field Modal
    'fieldModal.completeField': 'Complete {type} Field',
    'fieldModal.fieldPosition': 'Field position',
    'fieldModal.fieldSize': 'Size',
    'fieldModal.drawYour': 'Draw your {type}:',
    'fieldModal.enterYourText': 'Enter your text:',
    'fieldModal.textPlaceholder': 'Type your text here...',
    'fieldModal.todayDateInserted': 'Today\'s date will be inserted:',
    'fieldModal.required': '*',
    
    // Document Downloader
    'downloader.downloadComplete': 'Download complete',
    'downloader.downloadCompleteDescription': 'The signed document has been downloaded successfully.',
    'downloader.downloadFailed': 'Download failed',
    'downloader.downloadFailedDescription': 'Failed to download the document',
    'downloader.downloadFinalDocument': 'Download Final Document',
    'downloader.generating': 'Generating...',
    
    // PDF Viewer
    'pdfViewer.enterTextPreview': 'Enter Text Preview',
    'pdfViewer.loading': 'Loading document...',
    'pdfViewer.pageOf': 'Page {current} of {total}',
    
    // Toggle Sidebar
    'sidebar.toggleSidebar': 'Toggle Sidebar',
    
    // Pagination
    'pagination.goToPrevious': 'Go to previous page',
    'pagination.goToNext': 'Go to next page',
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    
    // Field Creator
    'fieldCreator.dragDropFields': 'Drag & Drop Fields',
    'fieldCreator.dragFieldsToPDF': 'Drag fields below to the PDF',
    'fieldCreator.selectSignerFirst': 'Select a signer first to enable field creation',
    'fieldCreator.signature': 'Signature',
    'fieldCreator.initial': 'Initial', 
    'fieldCreator.date': 'Date',
    'fieldCreator.text': 'Text',
    'fieldCreator.field': 'Field',
    
    // PDF Viewer Drag & Drop
    'pdfViewer.dragDropFieldsHere': 'Drag & Drop Fields Here',
    'pdfViewer.dragFieldsFromSidebar': 'Drag field types from the sidebar to place them on the document',
    
    // Drawing Canvas
    'drawingCanvas.clear': 'Clear',
    'drawingCanvas.applySignature': 'Apply Signature',
    'drawingCanvas.drawYourSignature': 'Draw Your Signature/Initial',
    
    // Text Modal
    'textModal.title': 'Enter Text Preview',
    'textModal.placeholder': 'Type your text here...',
    'textModal.applyPreview': 'Apply Preview',

    // Fields Summary
    'fieldsSummary.title': 'Fields Summary',

    // Email Configuration
    'email.settings': 'Email Settings',
    'email.configuration': 'Email Configuration',
    'email.configurationDescription': 'Configure your email settings to automatically send signing invitations',
    'email.addEmail': 'Add Email',
    'email.noConfigurations': 'No email configurations yet. Add one to start sending automatic invitations.',
    'email.emailAddress': 'Email Address',
    'email.displayName': 'Display Name',
    'email.smtpHost': 'SMTP Host',
    'email.smtpPort': 'SMTP Port',
    'email.smtpUsername': 'SMTP Username',
    'email.smtpPassword': 'SMTP Password',
    'email.useTLS': 'Use TLS Encryption',
    'email.setAsDefault': 'Set as Default',
    'email.default': 'Default',
    'email.setDefault': 'Set Default',
    'email.deleteConfiguration': 'Delete Email Configuration',
    'email.deleteConfirmation': 'Are you sure you want to delete this email configuration? This action cannot be undone.',
    'email.saveConfiguration': 'Save Configuration',
    'email.saving': 'Saving...',
    'email.loadError': 'Failed to load email configurations',
    'email.saveSuccess': 'Email configuration saved successfully',
    'email.saveError': 'Failed to save email configuration',
    'email.defaultUpdateSuccess': 'Default email configuration updated',
    'email.defaultUpdateError': 'Failed to update default configuration',
    'email.deleteSuccess': 'Email configuration deleted',
    'email.deleteError': 'Failed to delete configuration',
    'email.notAuthenticated': 'Not authenticated',
    'email.error': 'Error',
    'email.success': 'Success',
    
    // Email Templates
    'email.templates': 'Email Templates',
    'email.templateManagement': 'Template Management',
    'email.addTemplate': 'Add Template',
    'email.templateName': 'Template Name',
    'email.documentType': 'Document Type',
    'email.documentTypeOptional': 'Document Type (Optional)',
    'email.subjectTemplate': 'Subject Template',
    'email.bodyTemplate': 'Body Template',
    'email.defaultTemplate': 'Default Template',
    'email.setAsDefaultTemplate': 'Set as Default Template',
    'email.noTemplates': 'No email templates yet. Add one to customize your signing invitations.',
    'email.templateLoadError': 'Failed to load email templates',
    'email.templateSaved': 'Email template saved successfully',
    'email.templateDeleted': 'Email template deleted',
    'email.templateDefaultUpdated': 'Default template updated',
    'email.templateSaveError': 'Failed to save email template',
    'email.templateDeleteError': 'Failed to delete email template',
    'email.templateDefaultError': 'Failed to update default template',
    'email.deleteTemplate': 'Delete Email Template',
    'email.deleteTemplateConfirmation': 'Are you sure you want to delete this template? This action cannot be undone.',
    'email.subjectPlaceholder': 'Enter email subject template...',
    'email.bodyPlaceholder': 'Enter email body template...',
    'email.templateNamePlaceholder': 'Enter template name...',
    'email.documentTypePlaceholder': 'e.g., Contract, Agreement, Invoice',
    'email.availableVariables': 'Available Variables',
    'email.variablesHelp': 'Use these variables in your templates:',
    'email.docName': '{{document_name}} - Document name',
    'email.signerName': '{{signer_name}} - Signer name',
    'email.senderName': '{{sender_name}} - Your name',
    'email.signingLink': '{{signing_link}} - Signing link',
    'email.backToConfig': 'Back to Configuration',
    
    // Share Document Dialog - Email Message
    'share.emailMessage': 'Email Message (Optional)',
    'share.emailMessagePlaceholder': 'Add a personal message to include in the signing invitation email...',
    
    // Thank You Page
    'thankYou.title': 'Thank You!',
    'thankYou.documentSigned': 'Document Successfully Signed',
    'thankYou.thankYouName': 'Thank you, {name}!',
    'thankYou.appreciation': 'We appreciate you choosing to conduct your business with us. Your signature has been recorded and all parties will be notified.',
    'thankYou.returnHome': 'Return Home',
    'thankYou.closeWindow': 'You may now close this window.',
  },
  'fr-ca': {
    // Navigation
    'app.name': 'TurmelEsign',
    'nav.signOut': 'Se déconnecter',
    
    // Auth
    'auth.welcome': 'Bienvenue à TurmelEsign',
    'auth.subtitle': 'Signez des documents électroniquement en toute simplicité',
    'auth.signIn': 'Se connecter',
    'auth.signUp': "S'inscrire",
    'auth.email': 'Courriel',
    'auth.password': 'Mot de passe',
    'auth.fullName': 'Nom complet',
    'auth.enterEmail': 'Entrez votre courriel',
    'auth.enterPassword': 'Entrez votre mot de passe',
    'auth.createPassword': 'Créez un mot de passe',
    'auth.enterFullName': 'Entrez votre nom complet',
    'auth.signingIn': 'Connexion en cours...',
    'auth.creatingAccount': 'Création du compte...',
    'auth.createAccount': 'Créer un compte',
    'auth.success': 'Succès!',
    'auth.checkEmail': 'Veuillez vérifier votre courriel pour confirmer votre compte.',
    'auth.welcomeBack': 'Bon retour!',
    'auth.signedInSuccess': 'Vous vous êtes connecté avec succès.',
    'auth.signUpFailed': "L'inscription a échoué",
    'auth.signInFailed': 'La connexion a échoué',
    
    // Dashboard
    'dashboard.title': 'Tableau de bord des documents',
    'dashboard.subtitle': 'Gérez vos documents et signatures',
    'dashboard.uploadDocument': 'Téléverser un document',
    'dashboard.noDocuments': 'Aucun document pour le moment',
    'dashboard.uploadFirstDocument': 'Téléversez votre premier document pour commencer avec les signatures électroniques.',
    'dashboard.getStarted': 'Commencer',
    
    // Document actions
    'document.viewStatus': 'Voir le statut',
    'document.share': 'Partager',
    'document.shareLinks': 'Partager les liens',
    'document.edit': 'Modifier',
    'document.delete': 'Supprimer',
    'document.download': 'Télécharger',
    'document.created': 'Créé',
    'document.completed': 'Terminé',
    'document.signed': 'signé',
    'document.declined': 'refusé',
    'document.signatureFields': 'champs de signature',
    'document.deleteDocument': 'Supprimer le document',
    
    // Document upload
    'upload.title': 'Téléverser un document',
    'upload.documentDetails': 'Détails du document',
    'upload.documentName': 'Nom du document',
    'upload.enterDocumentName': 'Entrez le nom du document',
    'upload.uploadPDFFile': 'Téléverser un fichier PDF',
    'upload.dropHere': 'Déposez votre PDF ici ou cliquez pour parcourir',
    'upload.pdfOnly': 'Fichiers PDF seulement, jusqu\'à 50 MB',
    'upload.invalidFileType': 'Type de fichier invalide',
    'upload.pdfOnlyError': 'Veuillez téléverser un fichier PDF seulement.',
    'upload.missingInfo': 'Information manquante',
    'upload.selectFileAndName': 'Veuillez sélectionner un fichier et entrer un nom de document.',
    'upload.success': 'Succès',
    'upload.uploadedSuccessfully': 'Document téléversé avec succès!',
    'upload.uploadFailed': 'Téléversement échoué',
    'upload.failedToUpload': 'Échec du téléversement du document',
    'upload.uploading': 'Téléversement...',
    'upload.continueToEditor': 'Continuer vers l\'éditeur',
    
    // Document status dialog
    'status.documentStatus': 'Statut du document',
    'status.viewProgress': 'Voir le statut actuel et le progrès de tous les signataires pour ce document.',
    'status.signers': 'Signataires',
    'status.fields': 'Champs',
    'status.completed': 'terminé',
    'status.signersProgress': 'Progrès des signataires',
    'status.progress': 'Progrès',
    'status.fieldsCompleted': 'champs terminés',
    'status.signedOn': 'Signé le',
    'status.noSigners': 'Aucun signataire n\'a encore été ajouté à ce document.',
    
    // Share document dialog
    'share.title': 'Partager le document pour signature',
    'share.description': 'Partagez ces liens personnalisés avec les signataires pour leur permettre de signer le document. Chaque lien devient invalide une fois que le signataire complète ou refuse.',
    'share.pending': 'En attente',
    'share.signingLink': 'Lien de signature',
    'share.qrCode': 'Code QR',
    'share.showQRCode': 'Montrez ce code QR à',
    'share.forEasyAccess': 'pour un accès mobile facile.',
    'share.generatingQR': 'Génération du code QR...',
    'share.linkCopied': 'Lien copié!',
    'share.linkCopiedDescription': 'Le lien de signature a été copié dans le presse-papiers.',
    'share.copyFailed': 'Copie échouée',
    'share.copyFailedDescription': 'Échec de la copie du lien dans le presse-papiers.',
    'share.emailSent': 'Courriel envoyé',
    'share.emailSentDescription': 'Invitation de signature envoyée à {name}',
    'share.done': 'Terminé',
    
    // Delete document dialog
    'delete.title': 'Supprimer le document',
    'delete.confirmMessage': 'Êtes-vous sûr de vouloir supprimer "{name}"? Cette action ne peut pas être annulée et supprimera définitivement le document et toutes les signatures associées.',
    'delete.keepDocument': 'Garder le document',
    'delete.deleteForever': 'Supprimer définitivement',
    'delete.deleting': 'Suppression...',
    'delete.documentDeleted': 'Document supprimé',
    'delete.permanentlyDeleted': '"{name}" a été supprimé définitivement.',
    'delete.errorDeleting': 'Erreur lors de la suppression du document',
    'delete.failedToDelete': 'Échec de la suppression du document',
    
    // Signing interface
    'signing.signDocument': 'Signer le document',
    'signing.requiredRemaining': 'requis restants',
    'signing.declineToSign': 'Refuser de signer',
    'signing.completeSigning': 'Terminer la signature',
    'signing.clickFields': 'Cliquez sur n\'importe quel champ du document ci-dessous pour le signer.',
    'signing.completeRequired': 'Complétez tous les {count} champs requis pour terminer la signature.',
    
    // Status badges
    'status.draft': 'brouillon',
    'status.sent': 'envoyé',
    'status.statusCompleted': 'terminé',
    'status.declined': 'refusé',
    'status.pending': 'en attente',
    'status.partially_declined': 'partiellement_refusé',
    
    // Toasts
    'toast.signedOut': 'Déconnecté',
    'toast.signedOutSuccess': 'Vous avez été déconnecté avec succès.',
    'toast.signOutFailed': 'La déconnexion a échoué',
    
    // Common
    'common.loading': 'Chargement...',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.close': 'Fermer',
    'common.save': 'Enregistrer',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.share': 'Partager',
    'common.upload': 'Téléverser',
    'common.download': 'Télécharger',
    'common.add': 'Ajouter',
    'common.clear': 'Effacer',
    'common.apply': 'Appliquer',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    
    // Document Editor
    'editor.title': 'Éditeur de document',
    'editor.fields': 'champs',
    'editor.signers': 'signataires',
    'editor.signer': 'signataire',
    'editor.field': 'champ',
    'editor.shareLinks': 'Partager les liens',
    'editor.editMode': 'Mode édition',
    'editor.previewMode': 'Mode aperçu',
    'editor.saving': 'Enregistrement...',
    'editor.sendForSignature': 'Envoyer pour signature',
    
    // Signer Manager
    'signers.title': 'Signataires',
    'signers.add': 'Ajouter',
    'signers.signerName': 'Nom du signataire',
    'signers.emailAddress': 'Adresse courriel',
    'signers.missingInfo': 'Information manquante',
    'signers.enterNameAndEmail': 'Veuillez entrer le nom et le courriel.',
    'signers.duplicateEmail': 'Courriel en double',
    'signers.emailExists': 'Un signataire avec ce courriel existe déjà.',
    'signers.signerAdded': 'Signataire ajouté',
    'signers.signerAddedDescription': '{name} a été ajouté au document.',
    'signers.signerRemoved': 'Signataire supprimé',
    'signers.signerRemovedDescription': '{name} et ses champs ont été supprimés.',
    'signers.noSigners': 'Aucun signataire configuré',
    'signers.addFirstSigner': 'Ajoutez votre premier signataire pour commencer',
    
    // Decline Dialog
    'decline.title': 'Refuser de signer le document',
    'decline.message': 'Êtes-vous sûr de vouloir refuser de signer ce document? Cette action notifiera le propriétaire du document et ne peut pas être annulée.',
    'decline.reasonLabel': 'Raison du refus (optionnel)',
    'decline.reasonPlaceholder': 'Veuillez fournir une raison pour refuser de signer...',
    'decline.declining': 'Refus en cours...',
    'decline.declineToSign': 'Refuser de signer',
    'decline.documentDeclined': 'Document refusé',
    'decline.documentDeclinedDescription': 'Vous avez refusé de signer ce document avec succès.',
    'decline.errorDeclining': 'Erreur lors du refus du document',
    'decline.failedToDecline': 'Échec du refus du document',
    
    // Signing Field Modal
    'fieldModal.completeField': 'Compléter le champ {type}',
    'fieldModal.fieldPosition': 'Position du champ',
    'fieldModal.fieldSize': 'Taille',
    'fieldModal.drawYour': 'Dessinez votre {type}:',
    'fieldModal.enterYourText': 'Entrez votre texte:',
    'fieldModal.textPlaceholder': 'Tapez votre texte ici...',
    'fieldModal.todayDateInserted': 'La date d\'aujourd\'hui sera insérée:',
    'fieldModal.required': '*',
    
    // Document Downloader
    'downloader.downloadComplete': 'Téléchargement terminé',
    'downloader.downloadCompleteDescription': 'Le document signé a été téléchargé avec succès.',
    'downloader.downloadFailed': 'Téléchargement échoué',
    'downloader.downloadFailedDescription': 'Échec du téléchargement du document',
    'downloader.downloadFinalDocument': 'Télécharger le document final',
    'downloader.generating': 'Génération...',
    
    // PDF Viewer
    'pdfViewer.enterTextPreview': 'Aperçu du texte',
    'pdfViewer.loading': 'Chargement du document...',
    'pdfViewer.pageOf': 'Page {current} sur {total}',
    
    // Toggle Sidebar
    'sidebar.toggleSidebar': 'Basculer la barre latérale',
    
    // Pagination
    'pagination.goToPrevious': 'Aller à la page précédente',
    'pagination.goToNext': 'Aller à la page suivante',
    'pagination.previous': 'Précédent',
    'pagination.next': 'Suivant',
    
    // Field Creator
    'fieldCreator.dragDropFields': 'Glisser-déposer les champs',
    'fieldCreator.dragFieldsToPDF': 'Glissez les champs ci-dessous vers le PDF',
    'fieldCreator.selectSignerFirst': 'Sélectionnez d\'abord un signataire pour activer la création de champs',
    'fieldCreator.signature': 'Signature',
    'fieldCreator.initial': 'Initiales',
    'fieldCreator.date': 'Date',
    'fieldCreator.text': 'Texte',
    'fieldCreator.field': 'Champ',
    
    // PDF Viewer Drag & Drop
    'pdfViewer.dragDropFieldsHere': 'Glisser-déposer les champs ici',
    'pdfViewer.dragFieldsFromSidebar': 'Glissez les types de champs depuis la barre latérale pour les placer sur le document',
    
    // Drawing Canvas
    'drawingCanvas.clear': 'Effacer',
    'drawingCanvas.applySignature': 'Appliquer la signature',
    'drawingCanvas.drawYourSignature': 'Dessinez votre signature/initiales',
    
    // Text Modal
    'textModal.title': 'Saisir l\'aperçu du texte',
    'textModal.placeholder': 'Tapez votre texte ici...',
    'textModal.applyPreview': 'Appliquer l\'aperçu',

    // Fields Summary
    'fieldsSummary.title': 'Résumé des champs',

    // Email Configuration
    'email.settings': 'Paramètres courriel',
    'email.configuration': 'Configuration courriel',
    'email.configurationDescription': 'Configurez vos paramètres courriel pour envoyer automatiquement les invitations de signature',
    'email.addEmail': 'Ajouter un courriel',
    'email.noConfigurations': 'Aucune configuration courriel pour le moment. Ajoutez-en une pour commencer à envoyer des invitations automatiques.',
    'email.emailAddress': 'Adresse courriel',
    'email.displayName': 'Nom d\'affichage',
    'email.smtpHost': 'Hôte SMTP',
    'email.smtpPort': 'Port SMTP',
    'email.smtpUsername': 'Nom d\'utilisateur SMTP',
    'email.smtpPassword': 'Mot de passe SMTP',
    'email.useTLS': 'Utiliser le chiffrement TLS',
    'email.setAsDefault': 'Définir par défaut',
    'email.default': 'Par défaut',
    'email.setDefault': 'Définir par défaut',
    'email.deleteConfiguration': 'Supprimer la configuration courriel',
    'email.deleteConfirmation': 'Êtes-vous sûr de vouloir supprimer cette configuration courriel? Cette action ne peut pas être annulée.',
    'email.saveConfiguration': 'Enregistrer la configuration',
    'email.saving': 'Enregistrement...',
    'email.loadError': 'Échec du chargement des configurations courriel',
    'email.saveSuccess': 'Configuration courriel enregistrée avec succès',
    'email.saveError': 'Échec de l\'enregistrement de la configuration courriel',
    'email.defaultUpdateSuccess': 'Configuration courriel par défaut mise à jour',
    'email.defaultUpdateError': 'Échec de la mise à jour de la configuration par défaut',
    'email.deleteSuccess': 'Configuration courriel supprimée',
    'email.deleteError': 'Échec de la suppression de la configuration',
    'email.notAuthenticated': 'Non authentifié',
    'email.error': 'Erreur',
    'email.success': 'Succès',
    
    // Email Templates
    'email.templates': 'Modèles de courriel',
    'email.templateManagement': 'Gestion des modèles',
    'email.addTemplate': 'Ajouter un modèle',
    'email.templateName': 'Nom du modèle',
    'email.documentType': 'Type de document',
    'email.documentTypeOptional': 'Type de document (Optionnel)',
    'email.subjectTemplate': 'Modèle d\'objet',
    'email.bodyTemplate': 'Modèle de corps',
    'email.defaultTemplate': 'Modèle par défaut',
    'email.setAsDefaultTemplate': 'Définir comme modèle par défaut',
    'email.noTemplates': 'Aucun modèle de courriel pour le moment. Ajoutez-en un pour personnaliser vos invitations de signature.',
    'email.templateLoadError': 'Échec du chargement des modèles de courriel',
    'email.templateSaved': 'Modèle de courriel enregistré avec succès',
    'email.templateDeleted': 'Modèle de courriel supprimé',
    'email.templateDefaultUpdated': 'Modèle par défaut mis à jour',
    'email.templateSaveError': 'Échec de l\'enregistrement du modèle de courriel',
    'email.templateDeleteError': 'Échec de la suppression du modèle de courriel',
    'email.templateDefaultError': 'Échec de la mise à jour du modèle par défaut',
    'email.deleteTemplate': 'Supprimer le modèle de courriel',
    'email.deleteTemplateConfirmation': 'Êtes-vous sûr de vouloir supprimer ce modèle? Cette action ne peut pas être annulée.',
    'email.subjectPlaceholder': 'Entrez le modèle d\'objet du courriel...',
    'email.bodyPlaceholder': 'Entrez le modèle de corps du courriel...',
    'email.templateNamePlaceholder': 'Entrez le nom du modèle...',
    'email.documentTypePlaceholder': 'ex. Contrat, Accord, Facture',
    'email.availableVariables': 'Variables disponibles',
    'email.variablesHelp': 'Utilisez ces variables dans vos modèles:',
    'email.docName': '{{document_name}} - Nom du document',
    'email.signerName': '{{signer_name}} - Nom du signataire',
    'email.senderName': '{{sender_name}} - Votre nom',
    'email.signingLink': '{{signing_link}} - Lien de signature',
    'email.backToConfig': 'Retour à la configuration',
    
    // Share Document Dialog - Email Message
    'share.emailMessage': 'Message courriel (optionnel)',
    'share.emailMessagePlaceholder': 'Ajoutez un message personnel à inclure dans le courriel d\'invitation de signature...',
    
    // Thank You Page
    'thankYou.title': 'Merci!',
    'thankYou.documentSigned': 'Document signé avec succès',
    'thankYou.thankYouName': 'Merci, {name}!',
    'thankYou.appreciation': 'Nous vous remercions d\'avoir choisi de faire affaire avec nous. Votre signature a été enregistrée et toutes les parties seront notifiées.',
    'thankYou.returnHome': 'Retourner à l\'accueil',
    'thankYou.closeWindow': 'Vous pouvez maintenant fermer cette fenêtre.',
  }
};