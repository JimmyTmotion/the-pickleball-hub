
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Printer, Eye, Download } from 'lucide-react';

interface ScheduleDisplayOptionsProps {
  onViewChange: (view: 'standard' | 'printable') => void;
  onDownloadCSV: () => void;
  currentView: 'standard' | 'printable';
}

const ScheduleDisplayOptions: React.FC<ScheduleDisplayOptionsProps> = ({
  onViewChange,
  onDownloadCSV,
  currentView
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Display Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <Label htmlFor="view-options" className="text-sm font-medium">
              View:
            </Label>
            <RadioGroup
              value={currentView}
              onValueChange={(value) => onViewChange(value as 'standard' | 'printable')}
              className="flex flex-row space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Standard
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="printable" id="printable" />
                <Label htmlFor="printable" className="flex items-center gap-1">
                  <Printer className="h-4 w-4" />
                  Printable
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={onDownloadCSV}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleDisplayOptions;
