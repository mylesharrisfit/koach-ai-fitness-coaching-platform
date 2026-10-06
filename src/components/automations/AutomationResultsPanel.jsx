import React, { useState } from 'react';
import { Send, Flag, Bell, SlidersHorizontal, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Initials, EmptyState } from '@/components/kit';
import { cn } from '@/lib/utils';
import { ACTION_META } from '@/lib/automationEngine';
import { db } from '@/api/supabaseClient';
import { toast } from 'sonner';

/* Execute the rule action for one client */
async function executeAction(rule, client, allCheckIns) {
  switch (rule.action_type) {
    case 'send_message':
    case 'send_template':
      if (!rule.action_message) return;
      await db.entities.Message.create({
        client_id: client.id,
        client_name: client.name,
        sender: 'coach',
        content: rule.action_message,
        tag: 'general',
        is_read: false,
      });
      await db.entities.AutomationRule.update(rule.id, {
        trigger_count: (rule.trigger_count || 0) + 1,
        last_triggered: new Date().toISOString().split('T')[0],
      });
      return `Message sent to ${client.name}`;

    case 'notify_coach':
      await db.entities.Notification.create({
        recipient_id: client.user_id,
        type: 'general',
        title: `Automation: ${rule.name}`,
        body: `${client.name} triggered rule "${rule.name}"`,
        related_client_id: client.id,
        is_read: false,
      });
      await db.entities.AutomationRule.update(rule.id, {
        trigger_count: (rule.trigger_count || 0) + 1,
        last_triggered: new Date().toISOString().split('T')[0],
      });
      return `Coach notified for ${client.name}`;

    case 'adjust_calories': {
      if (!client.assigned_nutrition_id) throw new Error('No nutrition plan assigned');
      const plans = await db.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
      const plan = plans[0];
      if (!plan) throw new Error('Nutrition plan not found');
      const delta = rule.action_calorie_delta || -100;
      const newCals = Math.max(1000, (plan.calories || 2000) + delta);
      await Promise.all([
        db.entities.NutritionPlan.update(plan.id, { calories: newCals }),
        db.entities.Message.create({
          client_id: client.id, client_name: client.name, sender: 'coach',
          content: `Your calorie target has been updated to ${newCals} kcal (${delta > 0 ? '+' : ''}${delta} adjustment).`,
          tag: 'nutrition', is_read: false,
        }),
        db.entities.AutomationRule.update(rule.id, {
          trigger_count: (rule.trigger_count || 0) + 1,
          last_triggered: new Date().toISOString().split('T')[0],
        }),
      ]);
      return `Calories → ${newCals} kcal for ${client.name}`;
    }

    case 'flag_client':
      await Promise.all([
        db.entities.Client.update(client.id, { lifecycle_status: 'at_risk' }),
        db.entities.AutomationRule.update(rule.id, {
          trigger_count: (rule.trigger_count || 0) + 1,
          last_triggered: new Date().toISOString().split('T')[0],
        }),
      ]);
      return `${client.name} flagged as at-risk`;

    case 'suggest_adjustment':
      await Promise.all([
        db.entities.Notification.create({
          recipient_id: client.user_id,
          type: 'general',
          title: `Plan adjustment needed: ${client.name}`,
          body: rule.action_message || `Review and adjust ${client.name}'s plan — triggered by rule "${rule.name}"`,
          related_client_id: client.id,
          is_read: false,
        }),
        db.entities.AutomationRule.update(rule.id, {
          trigger_count: (rule.trigger_count || 0) + 1,
          last_triggered: new Date().toISOString().split('T')[0],
        }),
      ]);
      return `Adjustment suggestion created for ${client.name}`;

    default:
      throw new Error('Unknown action type');
  }
}

function ActionIcon({ type }) {
  const icons = { send_message: Send, send_template: Send, notify_coach: Bell, adjust_calories: SlidersHorizontal, flag_client: Flag };
  const Icon = icons[type] || Check;
  return <Icon className="w-3.5 h-3.5" />;
}

function ClientRow({ rule, client, detail }) {
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);

  const execute = async () => {
    if (done || executing) return;
    setExecuting(true);
    try {
      const msg = await executeAction(rule, client);
      toast.success(msg);
      setDone(true);
    } catch (err) {
      toast.error(err.message);
    }
    setExecuting(false);
  };

  const aMeta = ACTION_META[rule.action_type] || {};

  return (
    <div className={cn('flex items-center gap-3 py-2.5', done && 'opacity-60')}>
      <Initials name={client.name || ''} size={32} tone="alert" />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground">{client.name}</p>
        <p className="text-[13px] text-muted-foreground">{detail}</p>
      </div>
      <button
        onClick={execute}
        disabled={done || executing}
        className={cn(
          'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-semibold border transition-colors whitespace-nowrap',
          done
            ? 'border-transparent text-success cursor-default'
            : 'border-input bg-card text-foreground hover:bg-accent'
        )}
      >
        {executing ? <Loader2 className="w-3 h-3 animate-spin" /> : done ? <Check className="w-3 h-3" /> : <ActionIcon type={rule.action_type} />}
        {done ? 'Done' : aMeta.label?.split(' ')[0] || 'Apply'}
      </button>
    </div>
  );
}

function RuleResultGroup({ rule, clients }) {
  const [expanded, setExpanded] = useState(true);
  const aMeta = ACTION_META[rule.action_type] || {};

  return (
    <div className="panel overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/40 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-foreground">{rule.name}</p>
          <p className="text-[13px] text-muted-foreground">Then {(aMeta.label || rule.action_type || '').toLowerCase()}</p>
        </div>
        <span className="text-[13px] font-semibold text-destructive flex-shrink-0">
          {clients.length} client{clients.length > 1 ? 's' : ''}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-3 border-t border-border">
          {/* Message preview */}
          {rule.action_message && (
            <div className="mt-3 bg-secondary rounded-lg px-3 py-2.5">
              <p className="text-[13px] font-semibold text-foreground mb-0.5">Message</p>
              <p className="text-sm text-foreground leading-relaxed line-clamp-2">"{rule.action_message}"</p>
            </div>
          )}

          {/* Client rows */}
          <div className="divide-y divide-border mt-1">
            {clients.map(({ client, detail }) => (
              <ClientRow key={client.id} rule={rule} client={client} detail={detail} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AutomationResultsPanel({ results }) {
  if (!results.length) {
    return (
      <div className="panel">
        <EmptyState title="Nothing caught" body="Every client is inside your rule thresholds." />
      </div>
    );
  }

  // Group by rule
  const grouped = results.reduce((acc, r) => {
    const key = r.rule.id;
    if (!acc[key]) acc[key] = { rule: r.rule, clients: [] };
    acc[key].clients.push({ client: r.client, detail: r.detail });
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.values(grouped).map(({ rule, clients }) => (
        <RuleResultGroup key={rule.id} rule={rule} clients={clients} />
      ))}
    </div>
  );
}