import { getListings } from '../client.js';
import type { Scenario } from '../types.js';

/** Seller ID → human-readable location for demo personas. */
const SELLER_ROUTES: Record<string, string> = {
  seller_001: "Maria's Farm → Austin (Dripping Springs, TX)",
  seller_002: "Pedernales Ranch → Austin (Johnson City, TX)",
  seller_003: "Lost Creek Gardens → Austin (Urban vertical farm)",
};

function buildTag(sellerId: string, unit: string): string {
  return `${sellerId.toUpperCase()}_${unit.toUpperCase().replace(/\s+/g, '_')}`;
}

export async function listScenarios(): Promise<Scenario[]> {
  const listings = await getListings();
  return listings
    .filter(l => l.available !== false)
    .map(l => ({
      id: l.id,
      tag: buildTag(l.sellerId, l.unit),
      title: l.title,
      route: SELLER_ROUTES[l.sellerId] ?? `${l.sellerId} → Austin`,
      unit: `$/${l.unit}`,
      buyerOpen: Math.round(l.publicPrice * 0.85 * 100) / 100,
      sellerOpen: l.publicPrice,
    }));
}
