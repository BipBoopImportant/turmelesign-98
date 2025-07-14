import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Plus, Settings, Trash2, ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmailConfiguration {
  id: string;
  email_address: string;
  display_name: string | null;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  use_tls: boolean;
  is_default: boolean;
}

interface EmailTemplate {
  id: string;
  email_config_id: string;
  template_name: string;
  document_type: string | null;
  subject_template: string;
  body_template: string;
  is_default: boolean;
}

interface EmailConfigurationDialogProps {
  trigger?: React.ReactNode;
}

export const EmailConfigurationDialog: React.FC<EmailConfigurationDialogProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [configurations, setConfigurations] = useState<EmailConfiguration[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'configurations' | 'templates'>('configurations');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email_address: '',
    display_name: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    use_tls: true,
    is_default: false
  });
  const [templateData, setTemplateData] = useState({
    template_name: '',
    document_type: '',
    subject_template: '',
    body_template: '',
    is_default: false
  });
  const { toast } = useToast();
  const { t } = useLanguage();

  const loadConfigurations = async () => {
    const { data, error } = await supabase
      .from('email_configurations')
      .select('id, email_address, display_name, smtp_host, smtp_port, smtp_username, use_tls, is_default')
      .order('is_default', { ascending: false });

    if (error) {
      toast({
        title: t('email.error'),
        description: t('email.loadError'),
        variant: "destructive",
      });
      return;
    }

    setConfigurations(data || []);
  };

  const loadTemplates = async (configId: string) => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('email_config_id', configId)
        .order('is_default', { ascending: false });

      if (error) {
        toast({
          title: t('email.error'),
          description: t('email.templateLoadError'),
          variant: "destructive",
        });
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  useEffect(() => {
    if (open) {
      loadConfigurations();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('email.notAuthenticated'));

      // If setting as default, first remove default from all others
      if (formData.is_default) {
        await supabase
          .from('email_configurations')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('email_configurations')
        .insert({
          ...formData,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: t('email.success'),
        description: t('email.saveSuccess'),
      });

      setFormData({
        email_address: '',
        display_name: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        use_tls: true,
        is_default: false
      });
      setShowForm(false);
      loadConfigurations();
    } catch (error: any) {
      toast({
        title: t('email.error'),
        description: error.message || t('email.saveError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (configId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('email.notAuthenticated'));

      // Remove default from all configurations
      await supabase
        .from('email_configurations')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('email_configurations')
        .update({ is_default: true })
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: t('email.success'),
        description: t('email.defaultUpdateSuccess'),
      });

      loadConfigurations();
    } catch (error: any) {
      toast({
        title: t('email.error'),
        description: error.message || t('email.defaultUpdateError'),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (configId: string) => {
    try {
      const { error } = await supabase
        .from('email_configurations')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      // Templates will be deleted automatically due to CASCADE

      toast({
        title: t('email.success'),
        description: t('email.deleteSuccess'),
      });

      loadConfigurations();
    } catch (error: any) {
      toast({
        title: t('email.error'),
        description: error.message || t('email.deleteError'),
        variant: "destructive",
      });
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigId) return;
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('email.notAuthenticated'));

      // If setting as default, first remove default from all others
      if (templateData.is_default) {
        await supabase
          .from('email_templates')
          .update({ is_default: false })
          .eq('email_config_id', selectedConfigId);
      }

      const { error } = await supabase
        .from('email_templates')
        .insert({
          ...templateData,
          user_id: user.id,
          email_config_id: selectedConfigId
        });

      if (error) throw error;

      toast({
        title: t('email.success'),
        description: t('email.templateSaved'),
      });

      setTemplateData({
        template_name: '',
        document_type: '',
        subject_template: '',
        body_template: '',
        is_default: false
      });
      setShowTemplateForm(false);
      loadTemplates(selectedConfigId);
    } catch (error: any) {
      toast({
        title: t('email.error'),
        description: error.message || t('email.templateSaveError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSetDefault = async (templateId: string) => {
    if (!selectedConfigId) return;
    
    try {
      // Remove default from all templates for this config
      await supabase
        .from('email_templates')
        .update({ is_default: false })
        .eq('email_config_id', selectedConfigId);

      // Set new default
      const { error } = await supabase
        .from('email_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: t('email.success'),
        description: t('email.templateDefaultUpdated'),
      });

      loadTemplates(selectedConfigId);
    } catch (error: any) {
      toast({
        title: t('email.error'),
        description: error.message || t('email.templateDefaultError'),
        variant: "destructive",
      });
    }
  };

  const handleTemplateDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: t('email.success'),
        description: t('email.templateDeleted'),
      });

      loadTemplates(selectedConfigId!);
    } catch (error: any) {
      toast({
        title: t('email.error'),
        description: error.message || t('email.templateDeleteError'),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t('email.settings')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('email.configuration')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm && currentView === 'configurations' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {t('email.configurationDescription')}
                </p>
                <Button onClick={() => setShowForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('email.addEmail')}
                </Button>
              </div>

              {configurations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground text-center">
                      {t('email.noConfigurations')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {configurations.map((config) => (
                    <Card key={config.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              {config.email_address}
                              {config.is_default && (
                                <Badge variant="secondary" className="text-xs">{t('email.default')}</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {config.display_name && `${config.display_name} • `}
                              {config.smtp_host}:{config.smtp_port} {config.use_tls ? '(TLS)' : '(No TLS)'}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            {!config.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefault(config.id)}
                                className="h-8 px-2 text-xs"
                              >
                                {t('email.setDefault')}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedConfigId(config.id);
                                setCurrentView('templates');
                                loadTemplates(config.id);
                              }}
                              className="h-8 px-2 text-xs"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {t('email.templates')}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('email.deleteConfiguration')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('email.deleteConfirmation')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(config.id)}>
                                    {t('common.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentView('configurations');
                    setSelectedConfigId(null);
                    setTemplates([]);
                  }}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('email.backToConfig')}
                </Button>
                <Button onClick={() => setShowTemplateForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('email.addTemplate')}
                </Button>
              </div>

              {!showTemplateForm && (
                <>
                  {templates.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground text-center">
                          {t('email.noTemplates')}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <Card key={template.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                  {template.template_name}
                                  {template.is_default && (
                                    <Badge variant="secondary" className="text-xs">{t('email.defaultTemplate')}</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {template.document_type && (
                                    <span className="text-blue-600">{template.document_type} • </span>
                                  )}
                                  {template.subject_template.substring(0, 50)}...
                                </CardDescription>
                              </div>
                              <div className="flex gap-1">
                                {!template.is_default && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTemplateSetDefault(template.id)}
                                    className="h-8 px-2 text-xs"
                                  >
                                    {t('email.setDefault')}
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('email.deleteTemplate')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('email.deleteTemplateConfirmation')}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleTemplateDelete(template.id)}>
                                        {t('common.delete')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {showTemplateForm && (
                <form onSubmit={handleTemplateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template_name">{t('email.templateName')} *</Label>
                      <Input
                        id="template_name"
                        value={templateData.template_name}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, template_name: e.target.value }))}
                        placeholder={t('email.templateNamePlaceholder')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document_type">{t('email.documentTypeOptional')}</Label>
                      <Input
                        id="document_type"
                        value={templateData.document_type}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, document_type: e.target.value }))}
                        placeholder={t('email.documentTypePlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject_template">{t('email.subjectTemplate')} *</Label>
                    <Input
                      id="subject_template"
                      value={templateData.subject_template}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, subject_template: e.target.value }))}
                      placeholder={t('email.subjectPlaceholder')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body_template">{t('email.bodyTemplate')} *</Label>
                    <Textarea
                      id="body_template"
                      value={templateData.body_template}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, body_template: e.target.value }))}
                      placeholder={t('email.bodyPlaceholder')}
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-800">{t('email.availableVariables')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-blue-700 mb-2">{t('email.variablesHelp')}</p>
                      <div className="space-y-1 text-xs text-blue-600">
                        <div>• {t('email.docName')}</div>
                        <div>• {t('email.signerName')}</div>
                        <div>• {t('email.senderName')}</div>
                        <div>• {t('email.signingLink')}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default_template"
                      checked={templateData.is_default}
                      onCheckedChange={(checked) => setTemplateData(prev => ({ ...prev, is_default: checked }))}
                    />
                    <Label htmlFor="is_default_template">{t('email.setAsDefaultTemplate')}</Label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? t('email.saving') : t('common.save')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowTemplateForm(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {showForm && currentView === 'configurations' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_address">{t('email.emailAddress')} *</Label>
                  <Input
                    id="email_address"
                    type="email"
                    value={formData.email_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_address: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">{t('email.displayName')}</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="smtp_host">{t('email.smtpHost')} *</Label>
                  <Input
                    id="smtp_host"
                    value={formData.smtp_host}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">{t('email.smtpPort')} *</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">{t('email.smtpUsername')} *</Label>
                  <Input
                    id="smtp_username"
                    value={formData.smtp_username}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtp_username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">{t('email.smtpPassword')} *</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={formData.smtp_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtp_password: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_tls"
                    checked={formData.use_tls}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_tls: checked }))}
                  />
                  <Label htmlFor="use_tls">{t('email.useTLS')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                  />
                  <Label htmlFor="is_default">{t('email.setAsDefault')}</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? t('email.saving') : t('email.saveConfiguration')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};