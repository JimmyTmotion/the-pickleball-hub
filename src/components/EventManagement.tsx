import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Event, EventType, MatchType } from '@/types/event';

const eventTypes: EventType[] = [
  'Tournament', 'Social', 'League', 'Nationals', 'Other', 'Regular Recreational', 'Festival'
];

const matchTypes: MatchType[] = [
  'Singles', 'Mixed Doubles', 'Gender Doubles'
];

interface EventManagementProps {
  onEventUpdated?: () => void;
}

const EventManagement = ({ onEventUpdated }: EventManagementProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      const formattedEvents: Event[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.start_date,
        endDate: event.end_date || undefined,
        startTime: event.start_time || undefined,
        endTime: event.end_time || undefined,
        eventType: event.event_type as EventType,
        matchTypes: event.match_types as MatchType[],
        thumbnail: event.thumbnail || undefined,
        prize: event.prize || undefined,
        ratingRequired: event.rating_required || undefined,
        indoor: event.indoor_outdoor,
        additionalInfo: event.additional_info || undefined,
        createdBy: event.created_by || undefined,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title,
      startDate: event.startDate,
      startTime: event.startTime || '',
      endDate: event.endDate || '',
      endTime: event.endTime || '',
      eventType: event.eventType,
      matchTypes: event.matchTypes,
      prize: event.prize || '',
      ratingRequired: event.ratingRequired || '',
      indoor: event.indoor || false,
      additionalInfo: event.additionalInfo || '',
      thumbnail: event.thumbnail || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;

    if (!editFormData.title || !editFormData.startDate || !editFormData.eventType || editFormData.matchTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: editFormData.title,
          start_date: editFormData.startDate,
          event_type: editFormData.eventType,
          match_types: editFormData.matchTypes,
          start_time: editFormData.startTime || null,
          end_date: editFormData.endDate || null,
          end_time: editFormData.endTime || null,
          prize: editFormData.prize || null,
          rating_required: editFormData.ratingRequired || null,
          indoor_outdoor: editFormData.indoor,
          additional_info: editFormData.additionalInfo || null,
          thumbnail: editFormData.thumbnail || null,
        })
        .eq('id', editingEvent.id);

      if (error) throw error;

      toast({
        title: "Success! 🎾",
        description: "Event updated successfully",
      });

      setEditingEvent(null);
      await loadEvents();
      onEventUpdated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event "${eventTitle}" deleted successfully`,
      });

      await loadEvents();
      onEventUpdated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleMatchTypeChange = (matchType: MatchType, checked: boolean) => {
    if (checked) {
      setEditFormData((prev: any) => ({
        ...prev,
        matchTypes: [...prev.matchTypes, matchType]
      }));
    } else {
      setEditFormData((prev: any) => ({
        ...prev,
        matchTypes: prev.matchTypes.filter((type: MatchType) => type !== matchType)
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Event Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Match Types</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{event.eventType}</Badge>
                </TableCell>
                <TableCell>{formatDate(event.startDate)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {event.matchTypes.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Event</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-title">Title *</Label>
                            <Input
                              id="edit-title"
                              value={editFormData.title || ''}
                              onChange={(e) => setEditFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-startDate">Start Date *</Label>
                              <Input
                                id="edit-startDate"
                                type="date"
                                value={editFormData.startDate || ''}
                                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, startDate: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-endDate">End Date</Label>
                              <Input
                                id="edit-endDate"
                                type="date"
                                value={editFormData.endDate || ''}
                                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, endDate: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-startTime">Start Time</Label>
                              <Input
                                id="edit-startTime"
                                type="time"
                                value={editFormData.startTime || ''}
                                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, startTime: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-endTime">End Time</Label>
                              <Input
                                id="edit-endTime"
                                type="time"
                                value={editFormData.endTime || ''}
                                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, endTime: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="edit-eventType">Event Type *</Label>
                            <Select 
                              value={editFormData.eventType || ''} 
                              onValueChange={(value: EventType) => setEditFormData((prev: any) => ({ ...prev, eventType: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                              <SelectContent>
                                {eventTypes.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Match Types * (select at least one)</Label>
                            <div className="flex gap-4 mt-2">
                              {matchTypes.map(type => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-match-${type}`}
                                    checked={(editFormData.matchTypes || []).includes(type)}
                                    onCheckedChange={(checked) => handleMatchTypeChange(type, checked as boolean)}
                                  />
                                  <Label htmlFor={`edit-match-${type}`}>{type}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-prize">Prize</Label>
                              <Input
                                id="edit-prize"
                                value={editFormData.prize || ''}
                                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, prize: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-ratingRequired">Rating Required</Label>
                              <Input
                                id="edit-ratingRequired"
                                value={editFormData.ratingRequired || ''}
                                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, ratingRequired: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="edit-thumbnail">Thumbnail URL</Label>
                            <Input
                              id="edit-thumbnail"
                              type="url"
                              value={editFormData.thumbnail || ''}
                              onChange={(e) => setEditFormData((prev: any) => ({ ...prev, thumbnail: e.target.value }))}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-indoor"
                              checked={editFormData.indoor || false}
                              onCheckedChange={(checked) => setEditFormData((prev: any) => ({ ...prev, indoor: checked }))}
                            />
                            <Label htmlFor="edit-indoor">Indoor Event</Label>
                          </div>

                          <div>
                            <Label htmlFor="edit-additionalInfo">Additional Information</Label>
                            <Textarea
                              id="edit-additionalInfo"
                              value={editFormData.additionalInfo || ''}
                              onChange={(e) => setEditFormData((prev: any) => ({ ...prev, additionalInfo: e.target.value }))}
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingEvent(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveEdit}
                              disabled={saving}
                            >
                              {saving ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{event.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteEvent(event.id, event.title)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {events.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No events found. Create your first event above!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventManagement;