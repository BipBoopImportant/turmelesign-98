
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EmailConfigurationDialog } from '@/components/EmailConfigurationDialog';
import { LogOut, FileText, User } from 'lucide-react';

interface NavigationProps {
  userEmail?: string;
  onSignOut: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ userEmail, onSignOut }) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: t('toast.signedOut'),
        description: t('toast.signedOutSuccess')
      });
      
      onSignOut();
    } catch (error: any) {
      toast({
        title: t('toast.signOutFailed'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{t('app.name')}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {userEmail && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{userEmail}</span>
              </div>
            )}
            <EmailConfigurationDialog />
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('nav.signOut')}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
