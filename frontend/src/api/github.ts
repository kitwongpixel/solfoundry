import type { GitHubActivitySummary, GitHubPublicEvent } from '../lib/profile';
import { summarizeGitHubEvents } from '../lib/profile';

const GITHUB_EVENTS_API = 'https://api.github.com';

export async function getGitHubActivity(
  username: string,
  signal?: AbortSignal,
): Promise<GitHubActivitySummary> {
  if (!username.trim()) {
    throw new Error('GitHub username is required');
  }

  const response = await fetch(`${GITHUB_EVENTS_API}/users/${encodeURIComponent(username)}/events/public?per_page=100`, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    let message = response.statusText || 'Failed to load GitHub activity';
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // Ignore non-JSON error bodies.
    }
    throw new Error(message);
  }

  const events = (await response.json()) as GitHubPublicEvent[];
  return summarizeGitHubEvents(username, events);
}
