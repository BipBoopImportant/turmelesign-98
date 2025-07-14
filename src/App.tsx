import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/integrations/supabase/client';
import { Auth } from '@/components/Auth';
import { Navigation } from '@/components/Navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/providers/ThemeProvider';
import type { User } from '@supabase/supabase-js';

// Lazy load components for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DocumentEditor = lazy(() => import('@/components/DocumentEditor').then(module => ({ default: module.DocumentEditor })));
const SigningInterface = lazy(() => import('@/components/SigningInterface').then(module => ({ default: module.SigningInterface })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Loading component for Suspense fallback
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Wrapper components with proper routing
const DocumentEditorWrapper: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  
  if (!documentId) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <DocumentEditor 
      documentId={documentId} 
      onClose={() => window.history.back()} 
    />
  );
};

const SigningInterfaceWrapper: React.FC = () => {
  const { documentId, signerEmail } = useParams<{ documentId: string; signerEmail: string }>();
  
  if (!documentId || !signerEmail) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <SigningInterface 
      documentId={documentId}
      signerEmail={decodeURIComponent(signerEmail)}
      onComplete={() => window.history.back()} 
    />
  );
};

// Protected routes wrapper
const ProtectedRoutes: React.FC<{ user: User; onSignOut: () => void }> = ({ user, onSignOut }) => (
  <div className="min-h-screen bg-background">
    <Navigation userEmail={user.email} onSignOut={onSignOut} />
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editor/:documentId" element={<DocumentEditorWrapper />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </div>
);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get current session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = () => {
    // The auth state change listener will handle updating the user state
  };

  const handleSignOut = () => {
    setUser(null);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <Routes>
                {/* Public signing route - no authentication required */}
                <Route path="/sign/:documentId/:signerEmail" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <SigningInterfaceWrapper />
                  </Suspense>
                } />
                
                {/* Protected routes */}
                <Route path="/*" element={
                  user ? (
                    <ProtectedRoutes user={user} onSignOut={handleSignOut} />
                  ) : (
                    <Auth onAuthSuccess={handleAuthSuccess} />
                  )
                } />
              </Routes>
              <Toaster />
            </Router>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;