import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Upload, HardDrive, File, Image, Trash2, Download, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface FileItem {
  id: string;
  name: string;
  file_size: number | null;
  mime_type: string | null;
  file_path: string;
  created_at: string;
  uploaded_by: string | null;
}

const FileManager: React.FC = () => {
  return <div>File Manager</div>;
};
const { user, adminProfile } = useAuth();
const { logActivity } = useActivityLogger();

const [files, setFiles] = useState<FileItem[]>([]);
const [stats, setStats] = useState({
  totalFiles: 0,
  storageUsed: 0,
  folders: 1
});
const [uploading, setUploading] = useState(false);
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  fetchFiles();
}, []);

const fetchFiles = async () => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return;
    }

    const typedData = (data || []) as FileItem[];
    setFiles(typedData);

    const totalSize = typedData.reduce((sum, file) => sum + (file.file_size || 0), 0);
    setStats({
      totalFiles: typedData.length,
      storageUsed: Math.round(totalSize / (1024 * 1024)),
      folders: 1
    });
  } catch (error) {
    console.error('Error fetching files:', error);
  }
};
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !user || !adminProfile) return;

  setUploading(true);

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${adminProfile.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('uploaded_files')
      .insert({
        name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: adminProfile.id
      } as any);

    if (dbError) throw dbError;

    await logActivity('Uploaded file', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    toast({
      title: 'File Uploaded Successfully',
      description: `${file.name} has been uploaded.`
    });

    fetchFiles();
  } catch (error) {
    toast({ title: 'Upload Failed', description: 'Try again.', variant: 'destructive' });
  } finally {
    setUploading(false);
    if (event.target) event.target.value = '';
  }
};

const handleDeleteFile = async (file: FileItem) => {
  if (!confirm('Are you sure you want to delete this file?')) return;

  try {
    await supabase.storage.from('uploads').remove([file.file_path]);

    const { error } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', file.id);

    if (error) throw error;

    toast({ title: 'File Deleted' });
    fetchFiles();
  } catch {
    toast({ title: 'Delete Failed', variant: 'destructive' });
  }
};

const handleDownloadFile = async (file: FileItem) => {
  try {
    const { data } = await supabase.storage.from('uploads').download(file.file_path);

    const url = URL.createObjectURL(data!);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast({ title: 'Download Failed', variant: 'destructive' });
  }
};

export default FileManager;

