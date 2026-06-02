const NUMBER_FORMAT = new Intl.NumberFormat('en-US');
const COMPACT_NUMBER_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});
const PRICE_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 6,
});

export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Rust: '#DEA584',
  Go: '#00ADD8',
  Solidity: '#363636',
  React: '#61DAFB',
  NextJS: '#FFFFFF',
  HTML: '#E34F26',
  CSS: '#1572B6',
  Markdown: '#083FA1',
};

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatDurationParts(totalMinutes: number): string {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || parts.length > 0) parts.push(`${hours}h`);
  if (parts.length === 0 || mins > 0) parts.push(`${mins}m`);
  return parts.join(' ');
}

export function timeAgo(value: string | number | Date): string {
  const date = toDate(value);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime())) return '—';
  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function timeLeft(value: string | number | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';

  const minutes = Math.ceil(diffMs / 60_000);
  return formatDurationParts(minutes);
}

export function formatCurrency(amount: number, token = 'USD'): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const normalized = token.toUpperCase();

  if (normalized === 'USD' || normalized === 'USDC') {
    return `$${NUMBER_FORMAT.format(value)}`;
  }

  return `${NUMBER_FORMAT.format(value)} ${normalized}`;
}

export function formatUsdPrice(amount: number): string {
  if (!Number.isFinite(amount)) return '$0.00';
  return PRICE_FORMAT.format(amount);
}

export function formatCompactValue(value: number): string {
  if (!Number.isFinite(value)) return '0';

  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${COMPACT_NUMBER_FORMAT.format(value / 1_000_000_000)}b`;
  if (abs >= 1_000_000) return `${COMPACT_NUMBER_FORMAT.format(value / 1_000_000)}m`;
  if (abs >= 1_000) return `${COMPACT_NUMBER_FORMAT.format(value / 1_000)}k`;
  if (Number.isInteger(value)) return `${value}`;
  return COMPACT_NUMBER_FORMAT.format(value);
}

export function formatPercentChange(value: number): string {
  if (!Number.isFinite(value)) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function truncateAddress(address: string, visible = 4): string {
  if (!address) return '—';
  if (address.length <= visible * 2 + 3) return address;
  return `${address.slice(0, visible)}...${address.slice(-visible)}`;
}
