import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Image as ImageIcon, ExternalLink, Save, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { clearDefaultThumbnailCache } from '@/utils/defaultThumbnail';

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: any;
  bucket_id: string;
}

interface ImageWithUrl extends StorageFile {
  publicUrl: string;
  size: string;
  usedInEvents: string[];
}

const ImageManagement = () => {
  const [images, setImages] = useState<ImageWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [defaultThumbnail, setDefaultThumbnail] = useState('');
  const [savingDefault, setSavingDefault] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadImages();
    loadDefaultThumbnail();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);

      // Get all files from the thumbnails folder in the event-thumbnails bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('event-thumbnails')
        .list('thumbnails', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (filesError) throw filesError;

      // Get all events to check which images are being used
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('title, thumbnail');

      if (eventsError) throw eventsError;

      // Process files and get public URLs
      const imagesWithDetails: ImageWithUrl[] = [];
      
      for (const file of files || []) {
        if (file.name && !file.name.endsWith('/')) { // Skip folders
          // Get public URL (include the thumbnails folder path)
          const { data: urlData } = supabase.storage
            .from('event-thumbnails')
            .getPublicUrl(`thumbnails/${file.name}`);

          // Check which events use this image
          const usedInEvents = events
            ?.filter(event => event.thumbnail && event.thumbnail.includes(file.name))
            .map(event => event.title) || [];

          // Format file size
          const sizeInKB = file.metadata?.size ? Math.round(file.metadata.size / 1024) : 0;
          const sizeFormatted = sizeInKB > 1024 
            ? `${Math.round(sizeInKB / 1024 * 100) / 100} MB`
            : `${sizeInKB} KB`;

          imagesWithDetails.push({
            ...file,
            publicUrl: urlData.publicUrl,
            size: sizeFormatted,
            usedInEvents
          });
        }
      }

      setImages(imagesWithDetails);
    } catch (error: any) {
      console.error('Error loading images:', error);
      toast({
        title: "Error",
        description: "Failed to load images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultThumbnail = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_email_settings')
        .select('setting_value')
        .eq('setting_key', 'default_event_thumbnail')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDefaultThumbnail(data.setting_value);
      }
    } catch (error: any) {
      console.error('Error loading default thumbnail:', error);
    }
  };

  const saveDefaultThumbnail = async () => {
    try {
      setSavingDefault(true);

      const { error } = await supabase
        .from('admin_email_settings')
        .upsert({
          setting_key: 'default_event_thumbnail',
          setting_value: defaultThumbnail
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      // Clear the cache so components will use the new default
      clearDefaultThumbnailCache();

      toast({
        title: "Success",
        description: "Default thumbnail updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving default thumbnail:', error);
      toast({
        title: "Error",
        description: "Failed to save default thumbnail",
        variant: "destructive",
      });
    } finally {
      setSavingDefault(false);
    }
  };

  const handleDeleteImage = async (fileName: string) => {
    try {
      setDeleting(fileName);

      // Delete the file from storage (include the thumbnails folder path)
      const { error } = await supabase.storage
        .from('event-thumbnails')
        .remove([`thumbnails/${fileName}`]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Image "${fileName}" deleted successfully`,
      });

      // Reload images
      await loadImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div>Loading images...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Default Thumbnail Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Default Thumbnail Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set the default thumbnail URL that will be used when an event doesn't have a thumbnail or the thumbnail is deleted.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-thumbnail">Default Thumbnail URL</Label>
            <Input
              id="default-thumbnail"
              placeholder="Enter default thumbnail URL"
              value={defaultThumbnail}
              onChange={(e) => setDefaultThumbnail(e.target.value)}
            />
          </div>
          {defaultThumbnail && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden">
                <img
                  src={defaultThumbnail}
                  alt="Default thumbnail preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-muted-foreground"><span class="text-xs">Invalid URL</span></div>`;
                  }}
                />
              </div>
            </div>
          )}
          <Button 
            onClick={saveDefaultThumbnail} 
            disabled={savingDefault || !defaultThumbnail}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {savingDefault ? 'Saving...' : 'Save Default Thumbnail'}
          </Button>
        </CardContent>
      </Card>

      {/* Image Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage uploaded event thumbnail images. Be careful deleting images that are still in use by events.
          </p>
        </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No images uploaded yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Used In Events</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.name}>
                  <TableCell>
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={image.publicUrl}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{image.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(image.publicUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{image.size}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(image.created_at)}
                  </TableCell>
                  <TableCell>
                    {image.usedInEvents.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {image.usedInEvents.map((eventTitle, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {eventTitle}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Not used
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleting === image.name}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deleting === image.name ? 'Deleting...' : 'Delete'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Image</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{image.name}"?
                            {image.usedInEvents.length > 0 && (
                              <div className="mt-2 p-2 bg-destructive/10 rounded">
                                <p className="text-destructive font-medium">Warning:</p>
                                <p className="text-sm">This image is currently used in {image.usedInEvents.length} event(s). Deleting it will break the image display for those events.</p>
                              </div>
                            )}
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteImage(image.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Image
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageManagement;