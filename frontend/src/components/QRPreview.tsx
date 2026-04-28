import { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download, Copy, CheckCircle } from 'lucide-react';
import { svgToPngDataUrl, downloadDataUrl, shortHash } from '@/utils/qr';
import { toast } from './Toast';
import { useState } from 'react';

interface QRPreviewProps {
  certHash: string;
  studentName: string;
  txHash?: string;
  blockNumber?: number;
}

export function QRPreview({ certHash, studentName, txHash, blockNumber }: QRPreviewProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!qrRef.current) return;
    
    setDownloading(true);
    try {
      const svgElement = qrRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error('QR code not found');
      }

      const pngDataUrl = await svgToPngDataUrl(svgElement as SVGSVGElement, 512, 512);
      
      // Generate filename: Cert-<studentName>-<shortHash>.png
      const safeStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const shortHashStr = certHash.slice(0, 10);
      const filename = `Cert-${safeStudentName}-${shortHashStr}.png`;
      
      downloadDataUrl(pngDataUrl, filename);
      toast.success('QR code downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(certHash);
      setCopied(true);
      toast.success('Hash copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy hash');
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div className="flex justify-center">
        <div
          ref={qrRef}
          className="p-4 bg-foreground rounded-xl shadow-lg"
        >
          <QRCode
            value={certHash}
            size={200}
            level="H"
            bgColor="#FFFFFF"
            fgColor="#021024"
          />
        </div>
      </div>

      {/* Hash Display */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Certificate Hash</label>
        <div className="hash-display flex items-start justify-between gap-2">
          <span className="flex-1">{certHash}</span>
          <button
            onClick={handleCopyHash}
            className="text-primary hover:text-primary/80 transition-colors shrink-0"
            aria-label="Copy hash to clipboard"
          >
            {copied ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Transaction Info */}
      {(txHash || blockNumber) && (
        <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border/30">
          <h4 className="text-sm font-medium text-foreground">Transaction Details</h4>
          {txHash && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Transaction Hash</span>
              <p className="font-mono text-xs text-primary break-all">{txHash}</p>
            </div>
          )}
          {blockNumber && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Block Number</span>
              <p className="font-mono text-sm text-foreground">{blockNumber}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Downloading...' : 'Download QR'}
        </button>
        <button
          onClick={handleCopyHash}
          className="btn-ghost flex items-center justify-center gap-2"
        >
          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Hash'}
        </button>
      </div>
    </div>
  );
}
