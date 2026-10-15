import { BCH_USD_PRICE, PUSD_DECIMALS } from './constants';

/** PUSD base units (cents) -> display string like "12.50". */
export function pusdToDisplay(units: number): string {
  return (units / 10 ** PUSD_DECIMALS).toFixed(PUSD_DECIMALS);
}

/** PUSD base units -> fiat-style string like "$12.50" (PUSD is pegged to USD). */
export function pusdToUsd(units: number): string {
  return '$' + pusdToDisplay(units);
}

export function satsToBch(sats: number): string {
  return (sats / 100_000_000).toFixed(8);
}

export function satsToUsd(sats: number): string {
  const usd = (sats / 100_000_000) * BCH_USD_PRICE;
  if (usd > 0 && usd < 0.01) return '$' + usd.toFixed(4);
  return '$' + usd.toFixed(2);
}

/** Approximate wall-clock duration of `blocks` BCH blocks (~10 min each). */
export function blocksToHuman(blocks: number): string {
  const minutes = blocks * 10;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours % 1 === 0 ? hours : hours.toFixed(1)} h`;
  const days = hours / 24;
  return `${days % 1 === 0 ? days : days.toFixed(1)} d`;
}

export function shortAddress(address: string, head = 10, tail = 6): string {
  if (!address) return '';
  if (address.length <= head + tail + 3) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

export function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}