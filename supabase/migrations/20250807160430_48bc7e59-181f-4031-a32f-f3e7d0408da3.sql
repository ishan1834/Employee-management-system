import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from "@/components/ui/progress";
import { 
  File, FileText, Image as ImageIcon, 
  UploadCloud, Trash2, Search, 
  ExternalLink, HardDrive, Loader2, Zap 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FileManager: React.FC = () => {
  const { adminProfile } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchFiles = async () => {
    const { data } = await supabase
      .from('uploaded_files')
      .select('*, admins!uploaded_files_uploaded_by_fkey(name)')
      .order('created_at', { ascending: false });
    setFiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();

    // ENABLE REAL-TIME SUBSCRIPTION
    // This listens for the 'INSERT' and 'DELETE' events you enabled in SQL
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'uploaded_files' }, 
        () => fetchFiles()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${adminProfile?.id}/${Date.now()}.${fileExt}`;

      // 1. Storage Upload
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Database Insert (Metadata)
      const { error: dbError } = await supabase.from('uploaded_files').insert({
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: adminProfile?.id // Matches your new index
      });

      if (dbError) throw dbError;
      toast({ title: "Asset Uploaded", description: "Real-time sync active." });
    } catch (error: any) {
      toast({ title: "Upload Error", description:
