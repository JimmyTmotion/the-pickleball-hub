import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Event, EventType } from '@/types/event';
import { getDefaultThumbnail } from '@/utils/defaultThumbnail';

interface EventModalProps {
  event: Event | null;
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const EventModal = ({ event, events, isOpen, onClose, onNavigate }: EventModalProps) => {
  const [defaultThumbnail, setDefaultThumbnail] = useState<string>('');

  useEffect(() => {
    const loadDefaultThumbnail = async () => {
      const thumbnail = await getDefaultThumbnail();
      setDefaultThumbnail(thumbnail);
    };
    loadDefaultThumbnail();
  }, []);

  if (!event) return null;

  const currentIndex = events.findIndex(e => e.id === event.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < events.length - 1;

  const formatDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    let formatted = date.toLocaleDateString('en-US', dateOptions);
    
    if (timeString) {
      formatted += ` at ${timeString}`;
    }
    
    return formatted;
  };

  const getEventTypeColor = (eventType: EventType) => {
    const colors = {
      'Tournament': 'bg-red-100 text-red-800',
      'Social': 'bg-blue-100 text-blue-800',
      'League': 'bg-green-100 text-green-800',
      'Nationals': 'bg-purple-100 text-purple-800',
      'Other': 'bg-gray-100 text-gray-800',
      'Regular Recreational': 'bg-yellow-100 text-yellow-800',
      'Festival': 'bg-pink-100 text-pink-800'
    };
    return colors[eventType] || colors['Other'];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
            <Badge className={getEventTypeColor(event.eventType)}>
              {event.eventType}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Image */}
          <div className="aspect-video relative overflow-hidden rounded-lg">
            <img
              src={event.thumbnail || defaultThumbnail}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/lovable-uploads/f2272b16-c6f9-43a4-9c5e-9f2f98722a16.png';
              }}
            />
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Start Date</p>
                  <p className="text-muted-foreground">{formatDate(event.startDate, event.startTime)}</p>
                </div>
              </div>
              
              {event.endDate && (
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">End Date</p>
                    <p className="text-muted-foreground">{formatDate(event.endDate, event.endTime)}</p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Match Types and Indoor/Outdoor */}
            {(event.matchTypes.length > 0 || event.indoor !== undefined) && (
              <div>
                <p className="font-medium mb-2">Match Information</p>
                <div className="space-y-2">
                  {event.matchTypes.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Match Types</p>
                      <div className="flex flex-wrap gap-2">
                        {event.matchTypes.map(type => (
                          <Badge key={type} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {event.indoor !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Venue Type</p>
                      <Badge variant="secondary">
                        {event.indoor ? 'Indoor' : 'Outdoor'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prize */}
            {event.prize && (
              <div>
                <p className="font-medium">Prize</p>
                <p className="text-muted-foreground">{event.prize}</p>
              </div>
            )}

            {/* Rating Required */}
            {event.ratingRequired && (
              <div>
                <p className="font-medium">Rating Required</p>
                <p className="text-muted-foreground">{event.ratingRequired}</p>
              </div>
            )}

            {/* Event Link */}
            {event.eventLink && (
              <div>
                <p className="font-medium mb-2">Event Registration</p>
                <Button asChild className="w-full">
                  <a 
                    href={event.eventLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Register for Event
                  </a>
                </Button>
              </div>
            )}

            {/* Additional Info */}
            {event.additionalInfo && (
              <div>
                <p className="font-medium">Additional Information</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.additionalInfo}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onNavigate('prev')}
              disabled={!hasPrev}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Event
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {events.length}
            </span>

            <Button
              variant="outline"
              onClick={() => onNavigate('next')}
              disabled={!hasNext}
              className="flex items-center gap-2"
            >
              Next Event
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;