import React from 'react';
import { MessageCircle, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProgramAssignedClientsPanel({
  assignedClients = [],
  allClients = [],
  programId,
  onAssign,
}) {
  const unassignedCount = allClients.length - assignedClients.length;

  return (
    <div>
      <h3 className="font-semibold text-[#1F2A44] mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Assigned Clients
      </h3>

      {assignedClients.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-[#9CA3AF] mb-3">No clients assigned yet</p>
          <Button size="sm" onClick={onAssign} className="w-full">
            <Plus className="w-3.5 h-3.5 mr-1" /> Assign Client
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {assignedClients.slice(0, 5).map((client) => {
              const progress = Math.round(Math.random() * 100); // Mock progress
              const currentWeek = Math.floor((progress / 100) * (12 || 1)) + 1; // Mock week

              return (
                <div key={client.id} className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={client.avatar_url} alt={client.name} />
                      <AvatarFallback className="text-xs">
                        {client.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-[#1F2A44] flex-1">{client.name}</span>
                    <button
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Message client"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="ml-8">
                    <div className="text-[#6B7280] mb-1">Week {currentWeek} of 12</div>
                    <div className="w-full bg-[#E7EAF3] rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {assignedClients.length > 5 && (
            <p className="text-xs text-[#9CA3AF] mb-3">
              +{assignedClients.length - 5} more client{assignedClients.length - 5 !== 1 ? 's' : ''}
            </p>
          )}

          {unassignedCount > 0 && (
            <Button size="sm" variant="outline" onClick={onAssign} className="w-full">
              <Plus className="w-3.5 h-3.5 mr-1" /> Assign New
            </Button>
          )}
        </>
      )}
    </div>
  );
}