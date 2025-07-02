import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Calendar, Users, MapPin, Hash, ArrowLeft } from 'lucide-react';
import { getSavedSchedules, deleteSchedule } from '@/utils/scheduleStorage';
import { SavedSchedule } from '@/types/schedule';
import { exportScheduleToCSV } from '@/utils/scheduleGenerator';
import { Link } from 'react-router-dom';
import ScheduleDisplay from '@/components/ScheduleDisplay';

const ScheduleHistory: React.FC = () => {
  const [savedSchedules, setSavedSchedules] = React.useState<SavedSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = React.useState<SavedSchedule | null>(null);

  React.useEffect(() => {
    setSavedSchedules(getSavedSchedules());
  }, []);

  const handleDelete = (id: string) => {
    deleteSchedule(id);
    setSavedSchedules(getSavedSchedules());
    if (selectedSchedule?.id === id) {
      setSelectedSchedule(null);
    }
  };

  const handleDownload = (schedule: SavedSchedule) => {
    const csv = exportScheduleToCSV(schedule.schedule);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${schedule.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (selectedSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={() => setSelectedSchedule(null)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">{selectedSchedule.name}</h1>
          </div>
          <ScheduleDisplay 
            schedule={selectedSchedule.schedule}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Generator
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Schedule History</h1>
          </div>
        </div>

        {savedSchedules.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Saved Schedules</h3>
              <p className="text-gray-500 mb-4">Generate your first schedule to see it here!</p>
              <Link to="/">
                <Button>Generate Schedule</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {savedSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {schedule.createdAt.toLocaleDateString()}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {schedule.config.numRounds} rounds
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {schedule.config.numPlayers} players
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {schedule.config.numCourts} courts
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>Total matches: {schedule.schedule.matches.length}</p>
                      <p>Created: {schedule.createdAt.toLocaleString()}</p>
                      {schedule.config.prioritizeUniquePartnerships && (
                        <Badge variant="secondary" className="mt-1">Unique Partnerships Prioritized</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        View Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(schedule)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(schedule.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleHistory;