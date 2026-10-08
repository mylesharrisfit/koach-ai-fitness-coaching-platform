import { useQuery } from '@tanstack/react-query';
import { portalDb } from '@/api/supabaseClient';

/** Public http(s) image URLs only: private storage refs aren't readable by the client. */
const publicUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null);

/**
 * The signed-in portal client's coach: { name, businessName, avatarUrl, logoUrl }.
 * Reads portal_coach_view (display fields only). `name` falls back to
 * "Your coach" while loading or when the coach hasn't set a name.
 */
export function usePortalCoach() {
  const { data } = useQuery({
    queryKey: ['portal-coach'],
    queryFn: () => portalDb.entities.PortalCoach.list(null, 1).then((rows) => rows[0] ?? null),
    staleTime: 10 * 60 * 1000,
  });
  return {
    name: data?.coach_name || 'Your coach',
    hasName: Boolean(data?.coach_name),
    businessName: data?.business_name || null,
    avatarUrl: publicUrl(data?.avatar_url) || publicUrl(data?.logo_url),
    logoUrl: publicUrl(data?.logo_url),
  };
}
