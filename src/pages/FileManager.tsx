
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
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${adminProfile.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: adminProfile.id
        } as any);

      if (dbError) {
        throw dbError;
      }

      // Log activity
      await logActivity('Uploaded file', { 
        fileName: file.name, 
        fileSize: file.size,
        fileType: file.type 
      });

      toast({
        title: 'File Uploaded Successfully',
        description: `${file.name} has been uploaded to the file manager.`
      });

      fetchFiles(); // Refresh file list
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([file.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', file.id);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'File Deleted',
        description: 'File has been successfully deleted.'
      });

      fetchFiles(); // Refresh file list
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(file.file_path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: `${file.name} is being downloaded.`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getFileIcon = (type: string | null) => {
    if (type?.startsWith('image/')) return Image;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ModuleLayout
      title="File & Media Manager"
      description="Upload tournament posters, certificates, receipts with cloud storage"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gradient">{stats.totalFiles}</p>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.storageUsed}MB</p>
                <p className="text-sm text-muted-foreground">Storage Used</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.folders}</p>
                <p className="text-sm text-muted-foreground">Folders</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload and Search */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <Button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading} 
                  className="gradient-primary"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Files & Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <HardDrive className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No files found' : 'No files yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Upload your first file to get started'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => {
                  const IconComponent = getFileIcon(file.mime_type);
                  return (
                    <div
                      key={file.id}
                      className="p-4 bg-black/20 rounded-lg border border-white/10 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <IconComponent className="w-8 h-8 text-purple-400" />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteFile(file)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-2 truncate">{file.name}</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Size: {formatFileSize(file.file_size)}</p>
                        <p>Uploaded: {new Date(file.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default FileManager;
