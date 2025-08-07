import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Trash2 } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
  };
}

interface ClubNoticesProps {
  notices: Notice[];
  newNotice: { title: string; content: string };
  isOwner: boolean;
  userId?: string;
  onNewNoticeChange: (field: 'title' | 'content', value: string) => void;
  onCreateNotice: (e: React.FormEvent) => void;
  onDeleteNotice: (noticeId: string) => void;
}

const ClubNotices: React.FC<ClubNoticesProps> = ({
  notices,
  newNotice,
  isOwner,
  userId,
  onNewNoticeChange,
  onCreateNotice,
  onDeleteNotice
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Club Notices ({notices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Create notice form (only for members) */}
          <form onSubmit={onCreateNotice} className="space-y-4 mb-6">
            <div>
              <Label htmlFor="notice-title">Notice Title</Label>
              <Input
                id="notice-title"
                value={newNotice.title}
                onChange={(e) => onNewNoticeChange('title', e.target.value)}
                placeholder="Enter notice title..."
                required
              />
            </div>
            <div>
              <Label htmlFor="notice-content">Notice Content</Label>
              <Textarea
                id="notice-content"
                value={newNotice.content}
                onChange={(e) => onNewNoticeChange('content', e.target.value)}
                placeholder="Enter notice content..."
                rows={3}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Post Notice
            </Button>
          </form>

          {/* Notices list */}
          <div className="space-y-4">
            {notices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No notices posted yet.</p>
              </div>
            ) : (
              notices.map((notice) => (
                <Card key={notice.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          By {notice.profiles?.full_name || 'Unknown User'} on{' '}
                          {new Date(notice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {(isOwner || notice.user_id === userId) && (
                        <Button
                          onClick={() => onDeleteNotice(notice.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{notice.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubNotices;