import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, MapPin } from 'lucide-react';
import { Event, EventType, EventFilters, MatchType } from '@/types/event';
import { supabase } from '@/integrations/supabase/client';
import EventModal from './EventModal';

interface EventListProps {
  refreshTrigger?: number;
}

const EventList = ({ refreshTrigger }: EventListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<EventFilters>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const eventTypes: (EventType | 'All')[] = [
    'All',
    'Tournament',
    'Social',
    'League',
    'Nationals',
    'Other',
    'Regular Recreational',
    'Festival'
  ];

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', new Date().toISOString().split('T')[0])
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
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (filters.eventType) {
      filtered = filtered.filter(event => event.eventType === filters.eventType);
    }

    if (filters.startDate) {
      filtered = filtered.filter(event => 
        new Date(event.startDate) >= new Date(filters.startDate!)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(event => 
        new Date(event.startDate) <= new Date(filters.endDate!)
      );
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedEvent) return;
    
    const currentIndex = filteredEvents.findIndex(e => e.id === selectedEvent.id);
    let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < filteredEvents.length) {
      setSelectedEvent(filteredEvents[newIndex]);
    }
  };

  const formatDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
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
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="eventTypeFilter">Event Type</Label>
              <Select 
                value={filters.eventType || 'All'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  eventType: value === 'All' ? undefined : value as EventType 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All event types" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDateFilter">From Date</Label>
              <Input
                id="startDateFilter"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))}
              />
            </div>

            <div>
              <Label htmlFor="endDateFilter">To Date</Label>
              <Input
                id="endDateFilter"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))}
              />
            </div>

            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No upcoming events found</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <Card 
              key={event.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleEventClick(event)}
            >
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <img
                  src={event.thumbnail || 'https://uonuqhtnvleeybejigsr.supabase.co/storage/v1/object/public/event-thumbnails/thumbnails/1753648552098-58l7oybrg18.jpg'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/lovable-uploads/f2272b16-c6f9-43a4-9c5e-9f2f98722a16.png';
                  }}
                />
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg leading-tight">{event.title}</h3>
                    <Badge className={getEventTypeColor(event.eventType)}>
                      {event.eventType}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>{formatDate(event.startDate, event.startTime)}</span>
                    </div>
                    
                    {event.endDate && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>Ends: {formatDate(event.endDate, event.endTime)}</span>
                      </div>
                    )}

                    {event.indoor !== undefined && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.indoor ? 'Indoor' : 'Outdoor'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {event.matchTypes.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        events={filteredEvents}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default EventList;