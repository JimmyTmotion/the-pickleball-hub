import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageSquare, Settings, User, Calendar, RefreshCw } from 'lucide-react';

interface ContactQuery {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const ContactManagement: React.FC = () => {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [emailSettings, setEmailSettings] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContactQueries();
    loadEmailSettings();
  }, []);

  const loadContactQueries = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('contact_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueries(data || []);
    } catch (error) {
      console.error('Error loading contact queries:', error);
      toast({
        title: "Error",
        description: "Failed to load contact queries.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const loadEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_email_settings')
        .select('setting_value')
        .eq('setting_key', 'contact_notification_emails')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setEmailSettings(data?.setting_value || '');
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    try {
      const { error } = await supabase
        .from('admin_email_settings')
        .upsert({
          setting_key: 'contact_notification_emails',
          setting_value: emailSettings
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Email notification settings have been updated."
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings.",
        variant: "destructive"
      });
    }
  };

  const updateQueryStatus = async (queryId: string, status: string, notes?: string) => {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('contact_queries')
        .update(updateData)
        .eq('id', queryId);

      if (error) throw error;

      await loadContactQueries();
      setSelectedQuery(null);
      
      toast({
        title: "Query Updated",
        description: `Query status updated to ${status}.`
      });
    } catch (error) {
      console.error('Error updating query:', error);
      toast({
        title: "Error",
        description: "Failed to update query.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: "default" as const,
      in_progress: "secondary" as const,
      resolved: "outline" as const
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email-addresses">
              Notification Email Addresses (comma-separated)
            </Label>
            <Input
              id="email-addresses"
              value={emailSettings}
              onChange={(e) => setEmailSettings(e.target.value)}
              placeholder="admin@example.com, support@example.com"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              These email addresses will receive notifications when someone submits a contact form.
            </p>
          </div>
          <Button onClick={saveEmailSettings}>
            Save Email Settings
          </Button>
        </CardContent>
      </Card>

      {/* Contact Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contact Queries ({queries.length})
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadContactQueries}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No contact queries received yet.
            </p>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell className="text-sm">
                        {new Date(query.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{query.name}</TableCell>
                      <TableCell>{query.email}</TableCell>
                      <TableCell>{query.subject || 'No subject'}</TableCell>
                      <TableCell>{getStatusBadge(query.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedQuery(query)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Details Modal */}
      {selectedQuery && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Query from {selectedQuery.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm">{selectedQuery.email}</p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm">
                  {new Date(selectedQuery.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div>
              <Label>Subject</Label>
              <p className="text-sm">{selectedQuery.subject || 'No subject'}</p>
            </div>
            
            <div>
              <Label>Message</Label>
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                {selectedQuery.message}
              </p>
            </div>
            
            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={selectedQuery.admin_notes || ''}
                onChange={(e) => 
                  setSelectedQuery({
                    ...selectedQuery,
                    admin_notes: e.target.value
                  })
                }
                placeholder="Add internal notes about this query..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Select
                value={selectedQuery.status}
                onValueChange={(value) => 
                  setSelectedQuery({
                    ...selectedQuery,
                    status: value
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedQuery(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => 
                  updateQueryStatus(
                    selectedQuery.id, 
                    selectedQuery.status, 
                    selectedQuery.admin_notes
                  )
                }
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContactManagement;