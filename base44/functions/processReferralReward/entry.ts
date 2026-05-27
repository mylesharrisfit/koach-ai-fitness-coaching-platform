import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Auto-process referral rewards based on status conditions
// Called by entity automation when ClientReferral status changes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referral_id, status } = await req.json();

    if (!referral_id) {
      return Response.json({ error: 'Missing referral_id' }, { status: 400 });
    }

    // Get the referral
    const referral = await base44.asServiceRole.entities.ClientReferral.get(referral_id);
    if (!referral) {
      return Response.json({ error: 'Referral not found' }, { status: 404 });
    }

    // Get config
    const configs = await base44.asServiceRole.entities.ReferralConfiguration.filter(
      { coach_id: referral.coach_id },
      '-created_date',
      1
    );
    const config = configs[0];

    if (!config?.is_enabled) {
      return Response.json({ success: true, message: 'Program disabled' });
    }

    // Check if reward should be earned based on trigger
    let shouldEarnReward = false;
    if (config.reward_trigger === 'on_signup' && status === 'signed_up') {
      shouldEarnReward = true;
    } else if (config.reward_trigger === 'on_30_days' && status === 'active') {
      shouldEarnReward = true;
    }

    if (!shouldEarnReward) {
      return Response.json({ success: true, message: 'Trigger not met' });
    }

    // Create reward record
    const reward = await base44.asServiceRole.entities.ClientReferralReward.create({
      client_id: referral.referrer_client_id,
      client_name: referral.referrer_client_name,
      coach_id: referral.coach_id,
      referral_id: referral_id,
      reward_type: config.reward_type,
      reward_amount: config.reward_amount,
      reward_description: config.custom_reward_text || `${config.reward_type} reward`,
      date_earned: new Date().toISOString(),
      status: config.auto_apply_rewards ? 'applied' : 'pending',
    });

    // Update referral status
    await base44.asServiceRole.entities.ClientReferral.update(referral_id, {
      status: 'reward_earned',
      reward_earned_date: new Date().toISOString(),
    });

    // Send notification to client
    await base44.asServiceRole.functions.invoke('sendClientNotification', {
      client_id: referral.referrer_client_id,
      title: 'Reward Earned! 🎁',
      message: `You earned a reward: ${reward.reward_description}`,
      type: 'referral_reward',
    });

    return Response.json({ success: true, reward_id: reward.id });
  } catch (error) {
    console.error('Referral reward error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});