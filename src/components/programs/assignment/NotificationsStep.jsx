import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import SessionBookingMini from './SessionBookingMini';

export default function NotificationsStep({
  notifyClient,
  onNotifyClientChange,
  program,
  customMessage,
  startDate,
  selectedClients,
  scheduleKickoff,
  onScheduleKickoffChange,
  kickoffSession,
  onKickoffSessionChange,
  allClients,
}) {
  const [showBooking, setShowBooking] = useState(false);

  const selectedClientData = allClients.filter((c) => selectedClients.includes(c.id));
  const formattedDate = format(new Date(startDate), 'MMM d, yyyy');

  return (
    <div className="space-y-6">
      {/* Notify Client */}
      <div className="flex items-start justify-between p-3 border border-border rounded-lg">
        <div className="flex-1">
          <Label className="font-semibold">Notify client</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Sends an in-app notification and message to the client
          </p>
        </div>
        <Switch checked={notifyClient} onCheckedChange={onNotifyClientChange} />
      </div>

      {/* Notification Preview */}
      {notifyClient && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-3">Notification Preview</p>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-sm font-medium text-foreground">
              Your new program is ready! {program.title} starts {formattedDate}
            </p>
            {customMessage && (
              <p className="text-sm text-muted-foreground mt-2 p-2 bg-secondary rounded">
                {customMessage}
              </p>
            )}
            <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
              View Program
            </Button>
          </div>
        </Card>
      )}

      {/* Schedule Kickoff */}
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label className="font-semibold">Schedule kickoff check-in</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Book an onboarding call with the client
            </p>
          </div>
          <Switch checked={scheduleKickoff} onCheckedChange={onScheduleKickoffChange} />
        </div>

        {scheduleKickoff && (
          <div className="space-y-3">
            {kickoffSession ? (
              <Card className="p-3 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-900">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {format(new Date(kickoffSession.date + ' ' + kickoffSession.time), 'MMM d, yyyy • h:mm a')}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Kickoff scheduled for {selectedClientData.length > 1 ? 'all selected clients' : selectedClientData[0]?.name}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBooking(true)}
                  className="mt-2 text-xs h-7"
                >
                  Change
                </Button>
              </Card>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBooking(true)}
                className="w-full gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule Kickoff Call
              </Button>
            )}

            {showBooking && (
              <SessionBookingMini
                clients={selectedClientData}
                onConfirm={(session) => {
                  onKickoffSessionChange(session);
                  setShowBooking(false);
                }}
                onCancel={() => setShowBooking(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}