import { Shield, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background/30 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">CertiVerify</span>
          </div>

          {/* Info */}
          <p className="text-sm text-muted-foreground text-center">
            Decentralized Academic Certificate Verification System
          </p>

          {/* Links */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
            >
              Docs
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CertiVerify. Built on blockchain technology for tamper-proof verification.
        </div>
      </div>
    </footer>
  );
}
