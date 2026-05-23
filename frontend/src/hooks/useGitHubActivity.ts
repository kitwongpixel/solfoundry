import { useQuery } from '@tanstack/react-query';
import { getGitHubActivity } from '../api/github';

export function useGitHubActivity(username?: string | null) {
  return useQuery({
    queryKey: ['github-activity', username],
    enabled: Boolean(username),
    staleTime: 5 * 60 * 1000,
    queryFn: ({ signal }) => getGitHubActivity(username!, signal),
  });
}
