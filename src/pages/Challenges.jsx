import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { isCoachRole } from '@/lib/useRoleGuard';
import ChallengesHub from '@/components/community/ChallengesHub';

export default function Challenges() {
  const { me } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    me().then(user => {
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