import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { saveEvent } from '@/utils/eventStorage';
import { EventType, MatchType } from '@/types/event';
import { useAuth } from '@/hooks/useAuth';

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

interface EventFormProps {
  onEventCreated?: () => void;
}

const EventForm = ({ onEventCreated }: EventFormProps) => {
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
    indoor: false,
    additionalInfo: '',
    thumbnail: ''
  });

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
      await saveEvent({
        title: formData.title,
        startDate: formData.startDate,
        eventType: formData.eventType,
        matchTypes: formData.matchTypes,
        startTime: formData.startTime || undefined,
        endDate: formData.endDate || undefined,
        endTime: formData.endTime || undefined,
        prize: formData.prize || undefined,
        ratingRequired: formData.ratingRequired || undefined,
        indoor: formData.indoor,
        additionalInfo: formData.additionalInfo || undefined,
        thumbnail: formData.thumbnail || undefined,
        createdBy: user.id,
      });

      toast({
        title: "Success! 🎾",
        description: "Event created successfully",
      });

      // Reset form
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
        indoor: false,
        additionalInfo: '',
        thumbnail: ''
      });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
        <CardDescription>
          Add a new pickleball event or tournament
        </CardDescription>
      </CardHeader>
      <CardContent>
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

            <div>
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnail}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
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

            <div className="flex items-center space-x-2">
              <Switch
                id="indoor"
                checked={formData.indoor}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, indoor: checked }))}
              />
              <Label htmlFor="indoor">Indoor Event</Label>
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

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating Event..." : "Create Event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EventForm;