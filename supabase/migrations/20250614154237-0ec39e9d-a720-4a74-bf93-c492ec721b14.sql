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
  UploadCloud, Trash2, Download, Search, 
  ExternalLink, HardDrive, Loader2 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FileManager: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('uploaded_files')
      .select('*')
      .order('created_at', { ascending: false });
    setFiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB Limit Check (matches your SQL bucket limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

      // 1. Upload to Supabase Storage Bucket
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      // 2. Insert Metadata into uploaded_files table
      const { error: dbError } = await supabase.from('uploaded_files').insert({
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user?.id
      });

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast({ title: "Upload complete", description: `${file.name} is now available.` });
      fetchFiles();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm(`Permanently delete ${file.name}?`)) return;

    try {
      // Delete from Storage
      await supabase.storage.from('uploads').remove([file.file_path]);
      // Delete from Database (RLS handles ownership check)
      await supabase.from('uploaded_files').delete().eq('id', file.id);
      
      toast({ title: "File deleted" });
      fetchFiles();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('image')) return <ImageIcon className="w-5 h-5 text-pink-400" />;
    if (mime.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-blue-400" />;
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <ModuleLayout 
        title="File Storage" 
        description="Securely manage company documents and assets"
        actions={
          <div className="relative">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              onChange={handleUpload} 
              disabled={uploading}
            />
            <Button asChild size="sm" disabled={uploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Upload File'}
              </label>
            </Button>
          </div>
        }
      >
        {uploading && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Uploading asset...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1 bg-white/10" />
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search files..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-10 bg-white/5 border-white/10" 
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm">
            <HardDrive className="w-4 h-4" />
            <span>{files.length} Files</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-500 col-span
