import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EventType, MatchType } from '@/types/event';
import { useAuth } from '@/hooks/useAuth';
import ImageUpload from './ImageUpload';

const eventTypes: EventType[] = [
  'Tournament',
  'Social', 
  'League',
  'Nationals',
  'Other',
  'Regular Recreational',
  'Festival'
];

const matchTypes: MatchType[] = [
  'Singles',
  'Mixed Doubles',
  'Gender Doubles'
];

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
}

const EventFormModal = ({ open, onOpenChange, onEventCreated }: EventFormModalProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    eventType: '' as EventType,
    matchTypes: [] as MatchType[],
    prize: '',
    ratingRequired: '',
    indoor: 'Indoor Event',
    additionalInfo: '',
    thumbnail: '',
    eventLink: '',
    location: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      eventType: '' as EventType,
      matchTypes: [],
      prize: '',
      ratingRequired: '',
      indoor: 'Indoor Event',
      additionalInfo: '',
      thumbnail: '',
      eventLink: '',
      location: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create events",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.startDate || !formData.eventType || formData.matchTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          start_date: formData.startDate,
          event_type: formData.eventType,
          match_types: formData.matchTypes,
          start_time: formData.startTime || null,
          end_date: formData.endDate || null,
          end_time: formData.endTime || null,
          prize: formData.prize || null,
          rating_required: formData.ratingRequired || null,
          indoor_outdoor: formData.indoor === 'Indoor Event',
          additional_info: formData.additionalInfo || null,
          thumbnail: formData.thumbnail || null,
          event_link: formData.eventLink || null,
          location: formData.location || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success! 🎾",
        description: "Event created successfully",
      });

      resetForm();
      onOpenChange(false);
      onEventCreated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchTypeChange = (matchType: MatchType, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        matchTypes: [...prev.matchTypes, matchType]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        matchTypes: prev.matchTypes.filter(type => type !== matchType)
      }));
    }
  };

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, thumbnail: imageUrl }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new pickleball event or tournament
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Required Information</h3>
            
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown Community Center"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="eventLink">Event Link</Label>
              <Input
                id="eventLink"
                type="url"
                placeholder="https://example.com/event-registration"
                value={formData.eventLink}
                onChange={(e) => setFormData(prev => ({ ...prev, eventLink: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="eventType">Event Type *</Label>
              <Select 
                value={formData.eventType} 
                onValueChange={(value: EventType) => setFormData(prev => ({ ...prev, eventType: value }))}
                required
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
                      id={`match-${type}`}
                      checked={formData.matchTypes.includes(type)}
                      onCheckedChange={(checked) => handleMatchTypeChange(type, checked as boolean)}
                    />
                    <Label htmlFor={`match-${type}`}>{type}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Event Thumbnail</h3>
            <ImageUpload
              currentImageUrl={formData.thumbnail}
              onImageChange={handleImageChange}
            />
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Optional Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prize">Prize</Label>
                <Input
                  id="prize"
                  placeholder="e.g., $500 cash prize"
                  value={formData.prize}
                  onChange={(e) => setFormData(prev => ({ ...prev, prize: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ratingRequired">Rating Required</Label>
                <Input
                  id="ratingRequired"
                  placeholder="e.g., 3.5+"
                  value={formData.ratingRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, ratingRequired: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="indoor">Event Type</Label>
              <Select 
                value={formData.indoor} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, indoor: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indoor Event">Indoor Event</SelectItem>
                  <SelectItem value="Outdoor Event">Outdoor Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any other details about the event..."
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating Event..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormModal;