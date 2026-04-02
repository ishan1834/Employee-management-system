import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Eye, FileText, Download, Calendar, Mail, Phone,
  MapPin, Briefcase, User, Clock, CheckCircle, XCircle,
  AlertCircle, X, Loader2, RefreshCw
} from 'lucide-react';

// ===================== TYPES =====================
interface CareerApplication {
  id: string;
  full_name: string;
  mobile_number: string;
  email: string;
  full_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  date_of_birth: string | null;
  role_applied_for: string;
  years_of_experience: string | null;
  skills: string | null;
  why_join_thrylos: string | null;
  additional_notes: string | null;
  resume_url: string | null;
  aadhar_url: string | null;
  additional_documents: string[];
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ===================== DOCUMENTS SECTION =====================
const DocumentsSection: React.FC<{ application: CareerApplication }> = ({ application }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const openPreview = (url: string, title: string) => {
    const type = getFileType(url);
    if (type === 'other') return window.open(url, '_blank');

    setPreviewUrl(url);
    setPreviewType(type);
    setPreviewTitle(title);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    setPreviewTitle('');
  };

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Documents</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {application.resume_url && (
              <DocButton
                title="Resume / CV"
                url={application.resume_url}
                onClick={openPreview}
              />
            )}
            {application.aadhar_url && (
              <DocButton
                title="Aadhar Card"
                url={application.aadhar_url}
                onClick={openPreview}
              />
            )}
          </div>

          {application.additional_documents?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Additional Documents:
              </p>

              <div className="grid md:grid-cols-2 gap-2">
                {application.additional_documents.map((doc, i) => (
                  <button
                    key={i}
                    onClick={() => openPreview(doc, `Document ${i + 1}`)}
                    className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-white text-sm">Document {i + 1}</span>
                    <Eye className="ml-auto w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!application.resume_url &&
            !application.aadhar_url &&
            !application.additional_documents?.length && (
              <p className="text-center text-muted-foreground">
                No documents uploaded
              </p>
            )}
        </CardContent>
      </Card>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-5xl bg-black/95 p-0">
          <div className="flex justify-between p-4 border-b border-white/10">
            <DialogTitle>{previewTitle}</DialogTitle>

            <div className="flex gap-2">
              <Button onClick={() => window.open(previewUrl!, '_blank')}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={closePreview}>
                <X />
              </Button>
            </div>
          </div>

          <div className="p-4 max-h-[70vh] overflow-auto">
            {previewType === 'image' && (
              <img src={previewUrl!} className="mx-auto rounded-lg" />
            )}
            {previewType === 'pdf' && (
              <iframe src={previewUrl!} className="w-full h-[70vh]" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ===================== DOC BUTTON =====================
const DocButton = ({
  title,
  url,
  onClick
}: {
  title: string;
  url: string;
  onClick: (url: string, title: string) => void;
}) => (
  <button
    onClick={() => onClick(url, title)}
    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-white/10"
  >
    <FileText />
    <span>{title}</span>
    <Eye className="ml-auto" />
  </button>
);

// ===================== MAIN COMPONENT =====================
const CareerApplications: React.FC = () => {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<CareerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('career_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(
        (data || []).map(app => ({
          ...app,
          additional_documents: Array.isArray(app.additional_documents)
            ? app.additional_documents
            : []
        }))
      );
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch applications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const i = setInterval(fetchApplications, 5000);
    return () => clearInterval(i);
  }, []);

  // ===================== STATUS =====================
  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('career_applications')
        .update({
          status,
          reviewed_by: adminProfile?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Updated', description: `Status → ${status}` });
      fetchApplications();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  // ===================== UI HELPERS =====================
  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: ['yellow', AlertCircle],
      reviewed: ['blue', Eye],
      shortlisted: ['green', CheckCircle],
      rejected: ['red', XCircle],
      hired: ['purple', Briefcase]
    };

    const [color, Icon] = map[status] || ['gray', null];

    return (
      <Badge className={`bg-${color}-500/20 text-${color}-400`}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  const filtered =
    statusFilter === 'all'
      ? applications
      : applications.filter(a => a.status === statusFilter);

  if (adminProfile?.role !== 'super_admin') {
    return <div className="text-white text-center mt-20">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="container py-6">
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft />
        </Button>

        {isLoading ? (
          <Loader2 className="animate-spin mx-auto mt-10" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map(app => (
                <TableRow key={app.id}>
                  <TableCell>{app.full_name}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    <Button onClick={() => setSelectedApplication(app)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* DIALOG */}
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent>
            {selectedApplication && (
              <>
                <h2>{selectedApplication.full_name}</h2>

                <Select
                  value={selectedApplication.status}
                  onValueChange={(v) =>
                    updateApplicationStatus(selectedApplication.id, v)
                  }
                >
                  <SelectTrigger />
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>

                <DocumentsSection application={selectedApplication} />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CareerApplications;
