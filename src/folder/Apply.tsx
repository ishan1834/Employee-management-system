



import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { sendTelegram } from '@/hooks/useTelegram';
import { toast } from 'sonner';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { Reveal } from '@/components/ScrollAnimations';

export default function Apply() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [hasExisting, setHasExisting] = useState(false);
  const [checking, setChecking] = useState(true);

  const [form, setForm] = useState({
    gender: '', phone: '', trackId: '',
    collegeName: '', qualification: '', passingYear: '', city: '', state: '', country: '',
  });
  const [files, setFiles] = useState<{ profilePicture?: File; idCard?: File; resume?: File }>({});

  useEffect(() => {
    supabase.from('tracks').select('*').order('name').then(({ data }) => setTracks(data || []));
  }, []);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase.from('applications').select('id').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setHasExisting(true);
      setChecking(false);
    });
  }, [user]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in first'); navigate('/login'); return; }
    const required = ['gender', 'phone', 'trackId', 'collegeName', 'qualification', 'passingYear', 'city', 'state', 'country'];
    for (const field of required) {
      if (!form[field as keyof typeof form]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }
    if (!files.resume) { toast.error('Please upload your resume'); return; }

    setLoading(true);

    try {
      let resumeUrl: string | null = null;
      let idCardUrl: string | null = null;
      const telegramFiles: any[] = [];

      if (files.resume) {
        const ext = files.resume.name.split('.').pop();
        const path = `${user.id}/resume.${ext}`;
        const { error } = await supabase.storage.from('documents').upload(path, files.resume, { upsert: true });
        if (!error) {
          resumeUrl = path;
          telegramFiles.push({ bucket: 'documents', path, label: 'Resume' });
        }
      }
      if (files.idCard) {
        const ext = files.idCard.name.split('.').pop();
        const path = `${user.id}/id-card.${ext}`;
        const { error } = await supabase.storage.from('documents').upload(path, files.idCard, { upsert: true });
        if (!error) {
          idCardUrl = path;
          telegramFiles.push({ bucket: 'documents', path, label: 'ID Card' });
        }
      }
      if (files.profilePicture) {
        const ext = files.profilePicture.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        await supabase.storage.from('avatars').upload(path, files.profilePicture, { upsert: true });
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        await supabase.from('profiles').update({ avatar_url: urlData.publicUrl, phone: form.phone, gender: form.gender }).eq('user_id', user.id);
      } else {
        await supabase.from('profiles').update({ phone: form.phone, gender: form.gender }).eq('user_id', user.id);
      }

      const { error } = await supabase.from('applications').insert({
        user_id: user.id,
        track_id: form.trackId,
        college_name: form.collegeName,
        qualification: form.qualification,
        passing_year: form.passingYear,
        city: form.city,
        state: form.state,
        country: form.country,
        resume_url: resumeUrl,
        id_card_url: idCardUrl,
      });

      if (error) throw error;

      const selectedTrack = tracks.find(t => t.id === form.trackId);

      // Send Telegram notification
      sendTelegram('new_application', {
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
        phone: form.phone,
        college: form.collegeName,
        qualification: form.qualification,
        passingYear: form.passingYear,
        city: form.city,
        state: form.state,
        country: form.country,
        track: selectedTrack?.name || 'Unknown',
        files: telegramFiles,
      });

      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checking) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div>
        <section className="gradient-hero">
          <div className="container py-16 text-center">
            <Reveal>
              <h1 className="font-display text-4xl font-extrabold text-foreground">Apply to Kalyan Labs</h1>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Create an account first, then come back to apply.</p>
              <Button onClick={() => navigate('/signup')} className="mt-6 gradient-primary border-0 text-primary-foreground hover:scale-105 transition-transform duration-300">Create Account</Button>
            </Reveal>
          </div>
        </section>
      </div>
    );
  }

  if (hasExisting && !submitted) {
    return (
      <div className="gradient-hero min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Reveal direction="scale">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-secondary mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground">Application Already Submitted</h2>
            <p className="mt-3 text-muted-foreground">Check your dashboard for status updates.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-6 gradient-primary border-0 text-primary-foreground hover:scale-105 transition-transform duration-300">Go to Dashboard</Button>
          </div>
        </Reveal>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="gradient-hero min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Reveal direction="scale">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elevated text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-secondary mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground">Application Submitted!</h2>
            <p className="mt-3 text-sm text-muted-foreground">Your application is under review. Track your status on your dashboard.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-6 gradient-primary border-0 text-primary-foreground hover:scale-105 transition-transform duration-300">Go to Dashboard</Button>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div>
      <section className="gradient-hero">
        <div className="container py-16 text-center">
          <Reveal>
            <h1 className="font-display text-4xl font-extrabold text-foreground">Apply to Kalyan Labs</h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Fill in your details below. All fields are required unless noted.</p>
          </Reveal>
        </div>
      </section>

      <section className="container py-12 max-w-2xl mx-auto">
        <Reveal delay={200}>
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-6">
            <div>
              <Label>Profile Picture (optional)</Label>
              <div className="mt-1.5 flex items-center gap-4">
                {files.profilePicture ? (
                  <img src={URL.createObjectURL(files.profilePicture)} alt="Profile" className="h-16 w-16 rounded-full object-cover border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">Photo</div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && setFiles(prev => ({ ...prev, profilePicture: e.target.files![0] }))} />
                  <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" /> Upload Photo
                  </span>
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => update('gender', v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-Binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={e => update('phone', e.target.value)} className="mt-1.5" />
              </div>
            </div>

            <div>
              <Label>Track Selected</Label>
              <Select value={form.trackId} onValueChange={v => update('trackId', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose your learning track" /></SelectTrigger>
                <SelectContent>
                  {tracks.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        {t.icon_url ? <img src={t.icon_url} alt="" className="w-4 h-4 rounded object-cover" /> : <span>{t.icon}</span>}
                        {t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="collegeName">College Name</Label>
                <Input id="collegeName" placeholder="Your college/university" value={form.collegeName} onChange={e => update('collegeName', e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="qualification">Highest Qualification</Label>
                <Input id="qualification" placeholder="e.g. B.Tech, M.Sc" value={form.qualification} onChange={e => update('qualification', e.target.value)} className="mt-1.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="passingYear">Passing Year</Label>
                <Input id="passingYear" placeholder="e.g. 2026" value={form.passingYear} onChange={e => update('passingYear', e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Your city" value={form.city} onChange={e => update('city', e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" placeholder="Your state" value={form.state} onChange={e => update('state', e.target.value)} className="mt-1.5" />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="Your country" value={form.country} onChange={e => update('country', e.target.value)} className="mt-1.5" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Student ID Card (optional)</Label>
                <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-md border border-border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  {files.idCard ? files.idCard.name : 'Upload ID card'}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && setFiles(prev => ({ ...prev, idCard: e.target.files![0] }))} />
                </label>
              </div>
              <div>
                <Label>Resume (PDF)</Label>
                <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-md border border-border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  {files.resume ? files.resume.name : 'Upload resume'}
                  <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && setFiles(prev => ({ ...prev, resume: e.target.files![0] }))} />
                </label>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-primary border-0 text-primary-foreground h-12 text-base hover:scale-[1.01] transition-transform duration-300">
              {loading ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </form>
        </Reveal>
      </section>
    </div>
  );
}
