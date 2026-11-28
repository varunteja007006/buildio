import { MapPin, Utensils } from "lucide-react";

import { MerchantFinder } from "@/components/organisms/merchant-finder";

export default function Home() {
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="brand">
            <span className="brand-mark">
              <Utensils size={20} aria-hidden="true" />
            </span>
            Meal Card Finder
          </div>
          <div className="intro">
            <h1>Where can I use my meal card?</h1>
            <p>Find outlets listed in the Pluxee Meal Card directory.</p>
          </div>
        </div>
      </header>
      <main className="wrap finder">
        <MerchantFinder />
        <footer className="footer">
          <MapPin size={18} aria-hidden="true" />
          <p>
            Listings come from Pluxee. Confirm acceptance with the outlet before
            visiting.
          </p>
        </footer>
      </main>
    </>
  );
}
