import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';

interface ClubCreateFormProps {
  clubForm: {
    name: string;
    location_city: string;
    location_county: string;
    logo_url: string;
  };
  onClubFormChange: (field: string, value: string) => void;
  onCreateClub: (e: React.FormEvent) => void;
}

const ClubCreateForm: React.FC<ClubCreateFormProps> = ({
  clubForm,
  onClubFormChange,
  onCreateClub
}) => {
  return (
    <form onSubmit={onCreateClub} className="space-y-4">
      <div>
        <Label htmlFor="club-name">Club Name</Label>
        <Input
          id="club-name"
          value={clubForm.name}
          onChange={(e) => onClubFormChange('name', e.target.value)}
          placeholder="Enter club name..."
          required
        />
      </div>
      <div>
        <Label htmlFor="club-city">City</Label>
        <Input
          id="club-city"
          value={clubForm.location_city}
          onChange={(e) => onClubFormChange('location_city', e.target.value)}
          placeholder="Enter city..."
          required
        />
      </div>
      <div>
        <Label htmlFor="club-county">County</Label>
        <Input
          id="club-county"
          value={clubForm.location_county}
          onChange={(e) => onClubFormChange('location_county', e.target.value)}
          placeholder="Enter county..."
          required
        />
      </div>
      <div>
        <Label>Club Logo</Label>
        <ImageUpload
          onImageChange={(url) => onClubFormChange('logo_url', url)}
          currentImageUrl={clubForm.logo_url}
          className="mt-2"
        />
      </div>
      <Button type="submit" className="w-full">
        Create Club
      </Button>
    </form>
  );
};

export default ClubCreateForm;