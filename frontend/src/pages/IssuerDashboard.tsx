import { useState } from 'react';
import { FilePlus2, Loader2, User, BookOpen, Building2, Calendar } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { QRPreview } from '@/components/QRPreview';
import { toast } from '@/components/Toast';
import { issueCertificate, IssueCertificateResponse } from '@/utils/api';

interface FormData {
  studentName: string;
  course: string;
  institution: string;
  issueDate: string;
}

export default function IssuerDashboard() {
  const [formData, setFormData] = useState<FormData>({
    studentName: '',
    course: '',
    institution: '',
    issueDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<IssueCertificateResponse | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.studentName.trim()) {
      toast.error('Student name is required');
      return false;
    }
    if (!formData.course.trim()) {
      toast.error('Course name is required');
      return false;
    }
    if (!formData.institution.trim()) {
      toast.error('Institution name is required');
      return false;
    }
    if (!formData.issueDate) {
      toast.error('Issue date is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setCertificate(null);

    try {
      const response = await issueCertificate(formData);
      setCertificate(response);
      toast.success('Certificate issued successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to issue certificate';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentName: '',
      course: '',
      institution: '',
      issueDate: new Date().toISOString().split('T')[0],
    });
    setCertificate(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Certificate Issuance</h1>
          <p className="text-muted-foreground">
            Issue new academic certificates and generate verifiable QR codes
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Issuance Form */}
          <GlassCard className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <FilePlus2 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Certificate Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="input-glass pl-10"
                    aria-label="Student name"
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
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="Bachelor of Science in Computer Science"
                    className="input-glass pl-10"
                    aria-label="Course or degree name"
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
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="University of Technology"
                    className="input-glass pl-10"
                    aria-label="Institution name"
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
                    value={formData.issueDate}
                    onChange={handleChange}
                    className="input-glass pl-10"
                    aria-label="Issue date"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <FilePlus2 className="w-4 h-4" />
                      Issue Certificate
                    </>
                  )}
                </button>
                {certificate && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-ghost"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </GlassCard>

          {/* Right: QR Preview & Certificate Info */}
          <GlassCard className="animate-slide-up" style={{ animationDelay: '0.1s' } as React.CSSProperties}>
            {certificate ? (
              <QRPreview
                certHash={certificate.certHash}
                studentName={formData.studentName}
                txHash={certificate.txHash}
                blockNumber={certificate.blockNumber}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="p-4 rounded-2xl bg-muted/20 mb-4">
                  <FilePlus2 className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Certificate Issued Yet
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Fill in the certificate details and click "Issue Certificate" to generate a verifiable QR code
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
