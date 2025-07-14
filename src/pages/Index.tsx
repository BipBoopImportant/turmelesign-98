
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const features = [
    {
      icon: FileText,
      title: "Document Management",
      description: "Upload, organize, and manage all your documents in one secure location"
    },
    {
      icon: Users,
      title: "Multi-Signer Support",
      description: "Send documents to multiple signers with custom fields for each person"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Bank-level security with audit trails and compliance standards"
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Quick document preparation and instant notifications for all parties"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Upload Document",
      description: "Upload your PDF document to get started"
    },
    {
      step: "2",
      title: "Add Fields",
      description: "Place signature, date, and text fields where needed"
    },
    {
      step: "3",
      title: "Assign Signers",
      description: "Add signers and assign fields to specific people"
    },
    {
      step: "4",
      title: "Send & Track",
      description: "Send for signature and track progress in real-time"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Professional Document
              <span className="block text-primary">Signing Platform</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Streamline your document workflow with our secure, professional e-signature solution. 
              Perfect for businesses of all sizes.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/dashboard">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for document signing
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features to streamline your document workflow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-xl text-muted-foreground">
              Get your documents signed in 4 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why choose our platform?
              </h2>
              <div className="space-y-4">
                {[
                  "Legally binding signatures with audit trails",
                  "Multi-party signing with custom field assignments",
                  "Real-time notifications and progress tracking",
                  "Bank-level security and data encryption",
                  "Mobile-friendly signing experience",
                  "Automatic document archiving and storage"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-center">
                <FileText className="h-24 w-24 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to get started?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of businesses already using our platform
                </p>
                <Button asChild className="w-full">
                  <Link to="/dashboard">
                    Start Free Trial
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            © 2024 TurmelEsign. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
