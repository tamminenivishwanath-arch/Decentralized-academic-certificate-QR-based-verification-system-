import { useState, useRef, useCallback } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  QrCode, 
  Upload, 
  Camera, 
  Loader2, 
  User, 
  BookOpen, 
  Building2, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { GlassCard } from '@/components/GlassCard';
import { toast } from '@/components/Toast';
import { verifyCertificate, VerifyCertificateResponse } from '@/utils/api';
import { computeLocalHash, parseQRContent, normalizeHash } from '@/utils/qr';
import { cn } from '@/lib/utils';

type TabType = 'manual' | 'qr';
type VerificationStatus = 'idle' | 'verifying' | 'valid' | 'invalid' | 'error';

interface ManualFormData {
  studentName: string;
  course: string;
  institution: string;
  issueDate: string;
}

export default function VerifierDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  
  // Manual verification state
  const [manualForm, setManualForm] = useState<ManualFormData>({
    studentName: '',
    course: '',
    institution: '',
    issueDate: '',
  });
  
  // QR verification state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Shared state
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationResult, setVerificationResult] = useState<VerifyCertificateResponse | null>(null);
  const [verifiedHash, setVerifiedHash] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Manual form handlers
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
    setVerificationStatus('idle');
    setVerificationResult(null);
  };

  const handleManualVerify = async () => {
    if (!manualForm.studentName || !manualForm.course || !manualForm.institution || !manualForm.issueDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    setVerificationStatus('verifying');

    try {
      // Compute the hash locally using the same method as the backend
      // Backend uses: w3.keccak(text=studentName + course + institution + issueDate)
      const computedHash = computeLocalHash(
        manualForm.studentName,
        manualForm.course,
        manualForm.institution,
        manualForm.issueDate
      );
      
      setVerifiedHash(computedHash);
      
      const response = await verifyCertificate({ certHash: computedHash });
      setVerificationResult(response);
      setVerificationStatus(response.valid ? 'valid' : 'invalid');
      
      if (response.valid) {
        toast.success('Certificate is valid');
      } else {
        toast.warning('Certificate not found or invalid');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast.error(message);
      setVerificationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // QR verification handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImage(dataUrl);
      await decodeAndVerifyQR(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const decodeAndVerifyQR = async (imageData: string) => {
    setLoading(true);
    setVerificationStatus('verifying');

    try {
      // Create image element
      const img = new Image();
      img.src = imageData;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Initialize ZXing reader with hints
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      const reader = new BrowserMultiFormatReader(hints);
      
      // Decode QR from image
      const result = await reader.decodeFromImageElement(img);
      
      if (!result) {
        throw new Error('Could not read QR code from image. Make sure QR was created by issuer and downloaded as PNG/JPG.');
      }

      const qrContent = result.getText();
      
      // Parse QR content (handles both raw hex and JSON)
      const certHash = parseQRContent(qrContent);
      setVerifiedHash(certHash);

      // Verify with backend
      const response = await verifyCertificate({ certHash });
      setVerificationResult(response);
      setVerificationStatus(response.valid ? 'valid' : 'invalid');
      
      if (response.valid) {
        toast.success('Certificate is valid');
      } else {
        toast.warning('Certificate not found or invalid');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decode QR code';
      toast.error(message);
      setVerificationStatus('error');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Camera handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setCameraActive(true);
      scanFromCamera();
    } catch (error) {
      toast.error('Could not access camera');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const scanFromCamera = async () => {
    if (!videoRef.current) return;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    const reader = new BrowserMultiFormatReader(hints);

    const scan = async () => {
      if (!cameraActive || !videoRef.current || !streamRef.current) return;

      try {
        const result = await reader.decodeFromVideoElement(videoRef.current);
        if (result) {
          stopCamera();
          setLoading(true);
          setVerificationStatus('verifying');

          const qrContent = result.getText();
          const certHash = parseQRContent(qrContent);
          setVerifiedHash(certHash);

          const response = await verifyCertificate({ certHash });
          setVerificationResult(response);
          setVerificationStatus(response.valid ? 'valid' : 'invalid');
          
          if (response.valid) {
            toast.success('Certificate is valid');
          } else {
            toast.warning('Certificate not found or invalid');
          }
          setLoading(false);
          return;
        }
      } catch {
        // Continue scanning
      }

      if (streamRef.current) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  const clearUpload = () => {
    setUploadedImage(null);
    setVerificationStatus('idle');
    setVerificationResult(null);
    setVerifiedHash('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetVerification = () => {
    setVerificationStatus('idle');
    setVerificationResult(null);
    setVerifiedHash('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Certificate Verification</h1>
          <p className="text-muted-foreground">
            Verify academic credentials using certificate details or QR code
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30 mb-8">
          <button
            onClick={() => { setActiveTab('manual'); resetVerification(); }}
            className={cn('tab-button flex items-center gap-2', activeTab === 'manual' && 'tab-button-active')}
          >
            <FileText className="w-4 h-4" />
            Manual Verify
          </button>
          <button
            onClick={() => { setActiveTab('qr'); resetVerification(); }}
            className={cn('tab-button flex items-center gap-2', activeTab === 'qr' && 'tab-button-active')}
          >
            <QrCode className="w-4 h-4" />
            QR Verify
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input Panel */}
          <GlassCard className="animate-slide-up">
            {activeTab === 'manual' ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Certificate Details</h2>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Enter the exact certificate details to compute and verify the hash
                </p>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="studentName" className="text-sm font-medium text-foreground">
                      Student Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        id="studentName"
                        name="studentName"
                        type="text"
                        value={manualForm.studentName}
                        onChange={handleManualChange}
                        placeholder="John Doe"
                        className="input-glass pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="course" className="text-sm font-medium text-foreground">
                      Course / Degree
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        id="course"
                        name="course"
                        type="text"
                        value={manualForm.course}
                        onChange={handleManualChange}
                        placeholder="Bachelor of Science in Computer Science"
                        className="input-glass pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="institution" className="text-sm font-medium text-foreground">
                      Institution
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        id="institution"
                        name="institution"
                        type="text"
                        value={manualForm.institution}
                        onChange={handleManualChange}
                        placeholder="University of Technology"
                        className="input-glass pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="issueDate" className="text-sm font-medium text-foreground">
                      Issue Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        id="issueDate"
                        name="issueDate"
                        type="date"
                        value={manualForm.issueDate}
                        onChange={handleManualChange}
                        className="input-glass pl-10"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleManualVerify}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify Certificate
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">QR Code Verification</h2>
                </div>

                <div className="space-y-6">
                  {/* File Upload */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Upload QR Image</label>
                    
                    {uploadedImage ? (
                      <div className="relative">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded QR" 
                          className="w-full max-h-64 object-contain rounded-lg bg-muted/20"
                        />
                        <button
                          onClick={clearUpload}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/10">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Click or drag to upload PNG/JPG
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Camera */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Scan with Camera</label>
                    
                    {cameraActive ? (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          className="w-full rounded-lg bg-muted"
                          playsInline
                          muted
                        />
                        <button
                          onClick={stopCamera}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground"
                          aria-label="Stop camera"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-48 border-2 border-primary/50 rounded-lg" />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={startCamera}
                        className="btn-ghost w-full flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Open Camera Scanner
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </GlassCard>

          {/* Right: Result Panel */}
          <GlassCard className="animate-slide-up" style={{ animationDelay: '0.1s' } as React.CSSProperties}>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Verification Result</h2>
              </div>

              {verificationStatus === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="p-4 rounded-2xl bg-muted/20 mb-4">
                    <ShieldCheck className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Ready to Verify
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    {activeTab === 'manual' 
                      ? 'Enter certificate details and click verify to check authenticity'
                      : 'Upload a QR code image or use camera to scan and verify'}
                  </p>
                </div>
              )}

              {verificationStatus === 'verifying' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Verifying...</h3>
                  <p className="text-muted-foreground text-sm">
                    Checking certificate on blockchain
                  </p>
                </div>
              )}

              {verificationStatus === 'valid' && (
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/30">
                    <CheckCircle className="w-8 h-8 text-success shrink-0" />
                    <div>
                      <h3 className="font-semibold text-success">Certificate Valid</h3>
                      <p className="text-sm text-foreground/80">
                        This certificate has been verified on the blockchain
                      </p>
                    </div>
                  </div>

                  {verifiedHash && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Certificate Hash
                      </label>
                      <div className="hash-display">{verifiedHash}</div>
                    </div>
                  )}

                  {verificationResult?.certificate && (
                    <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border/30">
                      <h4 className="font-medium text-foreground">Certificate Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Student:</span>
                          <span className="text-foreground">{verificationResult.certificate.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Course:</span>
                          <span className="text-foreground">{verificationResult.certificate.course}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Institution:</span>
                          <span className="text-foreground">{verificationResult.certificate.institution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issue Date:</span>
                          <span className="text-foreground">{verificationResult.certificate.issueDate}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {verificationStatus === 'invalid' && (
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <XCircle className="w-8 h-8 text-destructive shrink-0" />
                    <div>
                      <h3 className="font-semibold text-destructive">Certificate Invalid</h3>
                      <p className="text-sm text-foreground/80">
                        This certificate could not be verified on the blockchain
                      </p>
                    </div>
                  </div>

                  {verifiedHash && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Computed Hash
                      </label>
                      <div className="hash-display">{verifiedHash}</div>
                    </div>
                  )}

                  {verificationResult?.message && (
                    <p className="text-sm text-muted-foreground">
                      {verificationResult.message}
                    </p>
                  )}
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <AlertTriangle className="w-8 h-8 text-warning shrink-0" />
                    <div>
                      <h3 className="font-semibold text-warning">Verification Error</h3>
                      <p className="text-sm text-foreground/80">
                        An error occurred during verification
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Please try again or check your connection to the backend server.
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
