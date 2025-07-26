export type EventType = 'Tournament' | 'Social' | 'League' | 'Nationals' | 'Other' | 'Regular Recreational' | 'Festival';

export type MatchType = 'Singles' | 'Mixed Doubles' | 'Gender Doubles';

export interface Event {
  id: string;
  title: string;
  startDate: string;
  eventType: EventType;
  matchTypes: MatchType[];
  
  // Optional fields
  thumbnail?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  prize?: string;
  ratingRequired?: string;
  indoor?: boolean;
  additionalInfo?: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
}