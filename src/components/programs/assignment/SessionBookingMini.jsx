import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

export default function SessionBookingMini({ clients, onConfirm, onCancel }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('14:00');

  const handleConfirm = () => {
    onConfirm({
      date,
      time,
      clients: clients.map((c) => c.id),
      title: `Kickoff Call - ${clients.map((c) => c.name).join(', ')}`,
      duration_minutes: 30,
    });
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 h-8 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold">Time</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 h-8 text-sm"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleConfirm}
            className="flex-1 text-xs h-8"
          >
            Schedule
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 text-xs h-8"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}