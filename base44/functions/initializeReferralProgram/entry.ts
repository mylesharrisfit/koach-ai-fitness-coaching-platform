import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Generate unique referral code from coach name/email
function generateReferralCode(name, email) {
  const namePart = (name || email.split('@')[0]).split(' ')[0].toUpperCase().slice(0, 6);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${namePart}${random}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already has referral program
    const existing = await base44.entities.ReferralProgram.filter(
      { coach_email: user.email },
      '',
      1
    );

    if (existing.length > 0) {
      return Response.json({ 
        success: false,
        message: 'Referral program already exists',
        program: existing[0],
      });
    }

    // Generate unique code
    const referralCode = generateReferralCode(user.full_name, user.email);

    // Create referral program
    const program = await base44.entities.ReferralProgram.create({
      coach_id: user.id,
      coach_email: user.email,
      referral_code: referralCode,
      referral_link: `https://koachai.com/join?ref=${referralCode.toLowerCase()}`,
      total_referrals: 0,
      total_earned: 0,
      pending_balance: 0,
      month_earnings: 0,
      current_tier: 1,
      is_active: true,
    });

    return Response.json({ 
      success: true,
      program,
      message: 'Referral program initialized',
    });
  } catch (error) {
    console.error('Initialize referral program error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});