import { MapPin, Navigation } from "lucide-react";

import type { Merchant } from "@/api/merchants/types";

export function MerchantCard({ merchant }: { merchant: Merchant }) {
  return (
    <li className="merchant-card">
      <span className="merchant-icon">
        <MapPin size={20} aria-hidden="true" />
      </span>
      <div className="merchant-details">
        <h3>{merchant.name}</h3>
        <p>{merchant.address}</p>
      </div>
      {merchant.directionsUrl && (
        <a
          className="directions"
          href={merchant.directionsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Directions to ${merchant.name}, ${merchant.address} (opens in a new tab)`}
        >
          <Navigation size={15} aria-hidden="true" /> Directions
        </a>
      )}
    </li>
  );
}
