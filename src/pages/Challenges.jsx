import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { isCoachRole } from '@/lib/useRoleGuard';
import ChallengesHub from '@/components/community/ChallengesHub';

export default function Challenges() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      // Step 6: 'admin' is platform staff; coaches carry role='user'. In the
      // coach app, any non-client session is the coach.
      setIsCoach(isCoachRole(user));
    }).catch(() => {});
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <ChallengesHub isCoach={isCoach} user={currentUser} />
    </div>
  );
}