import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, DollarSign, Dumbbell, Calendar, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import StatCard from '../components/shared/StatCard';
import PageHeader from '../components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-date', 50),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 10),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => base44.entities.Message.filter({ is_read: false }, '-created_date', 20),
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const monthlyRevenue = activeClients.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);
  const todaySessions = sessions.filter(s => s.date === format(new Date(), 'yyyy-MM-dd'));
  const upcomingSessions = sessions
    .filter(s => s.status === 'scheduled' && s.date >= format(new Date(), 'yyyy-MM-dd'))
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Dashboard" 
        subtitle={`Welcome back. You have ${todaySessions.length} sessions today.`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Clients" value={activeClients.length} icon={Users} trend="+12% this month" trendUp />
        <StatCard title="Monthly Revenue" value={`$${monthlyRevenue.toLocaleString()}`} icon={DollarSign} trend="+8% vs last month" trendUp />
        <StatCard title="Today's Sessions" value={todaySessions.length} icon={Calendar} />
        <StatCard title="Unread Messages" value={messages.length} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold">Upcoming Sessions</h2>
            <Link to="/schedule">
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No upcoming sessions</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map(session => (
                <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{session.client_name} • {session.time || 'TBD'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{format(new Date(session.date), 'MMM d')}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {session.type?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Check-ins */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold">Recent Check-ins</h2>
            <Link to="/progress">
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {checkIns.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No check-ins yet</p>
          ) : (
            <div className="space-y-3">
              {checkIns.slice(0, 5).map(ci => (
                <div key={ci.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-all">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                    {ci.client_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ci.client_name}</p>
                    <p className="text-xs text-muted-foreground">{ci.weight && `${ci.weight} lbs`} {ci.mood && `• ${ci.mood}`}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(new Date(ci.date), 'MMM d')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/clients" className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
          <Users className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-sm">Add Client</p>
          <p className="text-xs text-muted-foreground mt-0.5">Onboard new client</p>
        </Link>
        <Link to="/programs" className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
          <Dumbbell className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-sm">Build Program</p>
          <p className="text-xs text-muted-foreground mt-0.5">Create workout plan</p>
        </Link>
        <Link to="/schedule" className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
          <Calendar className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-sm">Book Session</p>
          <p className="text-xs text-muted-foreground mt-0.5">Schedule a call</p>
        </Link>
        <Link to="/store" className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
          <DollarSign className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-sm">Sell Plans</p>
          <p className="text-xs text-muted-foreground mt-0.5">List a program</p>
        </Link>
      </div>
    </div>
  );
}