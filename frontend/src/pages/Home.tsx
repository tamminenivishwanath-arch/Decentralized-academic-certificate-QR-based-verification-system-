import { Link } from 'react-router-dom';
import { Shield, FileCheck, QrCode, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

const features = [
  {
    icon: Lock,
    title: 'Blockchain Security',
    description: 'Certificates are stored as immutable hashes on the blockchain, ensuring tamper-proof records.',
  },
  {
    icon: FileCheck,
    title: 'Instant Issuance',
    description: 'Universities can issue verifiable certificates in seconds with automatic QR code generation.',
  },
  {
    icon: QrCode,
    title: 'Easy Verification',
    description: 'Verify any certificate by scanning its QR code or entering certificate details manually.',
  },
];

const steps = [
  { number: '01', title: 'Issue', description: 'University issues certificate with student details' },
  { number: '02', title: 'Store', description: 'Certificate hash is recorded on blockchain' },
  { number: '03', title: 'Share', description: 'Student receives QR code for their certificate' },
  { number: '04', title: 'Verify', description: 'Anyone can verify authenticity instantly' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6 animate-fade-in">
              <div className="p-4 rounded-2xl bg-primary/10 glow-primary">
                <Shield className="w-16 h-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Decentralized Academic
              <span className="text-gradient block mt-2">Certificate Verification</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Issue, store, and verify academic credentials on the blockchain. 
              Tamper-proof, instant, and globally accessible.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/login/university" className="btn-primary flex items-center justify-center gap-2">
                University Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login/verifier" className="btn-ghost flex items-center justify-center gap-2">
                Verify Certificate
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose CertiVerify?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on blockchain technology for maximum security and transparency
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <GlassCard key={feature.title} hover className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}>
                <div className="p-2 w-fit rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple four-step process from issuance to verification
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative animate-slide-up" style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}>
                <GlassCard className="text-center h-full">
                  <div className="text-4xl font-bold text-primary/30 mb-4">{step.number}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </GlassCard>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlassCard className="text-center py-12 glow-primary">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join institutions worldwide in securing academic credentials with blockchain technology.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login/university" className="btn-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Issue Certificates
              </Link>
              <Link to="/login/verifier" className="btn-ghost flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Verify Now
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
