"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ExternalLink, Search, SlidersHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import { endpoints } from "@/api/endpoints";
import { merchantQuery } from "@/api/merchants/query";
import {
  cities,
  cityIds,
  cityLabel,
  maxSearchLength,
  type MerchantSearch,
} from "@/api/merchants/types";
import { CityPicker } from "@/components/molecules/city-picker";
import { MerchantCard } from "@/components/molecules/merchant-card";
import { PinCodeFilter } from "@/components/molecules/pin-code-filter";

function Directory() {
  const [search, setSearch] = useState<MerchantSearch>({
    city: "chennai",
    name: "",
    page: 1,
    pincodes: [],
  });
  const outletInput = useRef<HTMLInputElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const { data, isPending, isError, isFetching, refetch } = useQuery(
    merchantQuery(search),
  );

  function selectCity(city: string) {
    if (city !== search.city) {
      setSearch({ ...search, city, pincodes: [], page: 1 });
    }
  }

  function changePage(page: number) {
    setSearch({ ...search, page });
    resultsHeading.current?.focus();
  }

  return (
    <>
      <section className="search-panel" aria-labelledby="filter-heading">
        <div className="filter-heading">
          <h2 id="filter-heading">
            <SlidersHorizontal size={19} aria-hidden="true" /> Filter outlets
          </h2>
          <Button
            className="text-button"
            type="button"
            onClick={() => {
              const input = outletInput.current;
              if (input) {
                input.value = "";
                input.focus();
              }
              setSearch({ ...search, name: "", pincodes: [], page: 1 });
            }}
          >
            Clear filters
          </Button>
        </div>
        <fieldset>
          <legend>City</legend>
          <div className="city-options">
            {cityIds.map((city) => (
              <Button
                className="city-option"
                key={city}
                type="button"
                aria-pressed={city === search.city}
                onClick={() => selectCity(city)}
              >
                {cities[city]}
              </Button>
            ))}
          </div>
          <CityPicker value={search.city} onChange={selectCity} />
        </fieldset>
        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(
              new FormData(event.currentTarget).get("outlet") ?? "",
            ).trim();
            setSearch({ ...search, name, page: 1 });
          }}
        >
          <label htmlFor="outlet">Outlet name</label>
          <div className="search-controls">
            <div className="input-wrap">
              <Search size={19} aria-hidden="true" />
              <Input
                className="search-input"
                id="outlet"
                name="outlet"
                ref={outletInput}
                placeholder="e.g. Barbeque Nation"
                maxLength={maxSearchLength}
                type="search"
              />
            </div>
            <Button className="search-button" type="submit">
              Search
            </Button>
          </div>
        </form>
        <PinCodeFilter
          key={search.city}
          city={search.city}
          value={search.pincodes}
          onChange={(pincodes) => setSearch({ ...search, pincodes, page: 1 })}
        />
      </section>

      <section className="results" aria-labelledby="results-heading">
        <div className="results-header">
          <div>
            <h2 id="results-heading" tabIndex={-1} ref={resultsHeading}>
              Meal partners in {cityLabel(search.city)}
            </h2>
            <p className="result-summary" role="status">
              {isPending && "Loading outlets…"}
              {data && (
                <>
                  {data.total.toLocaleString("en-IN")}{" "}
                  {data.total === 1 ? "outlet" : "outlets"}
                  {search.name && <> matching “{search.name}”</>}
                  {search.pincodes.length > 0 && (
                    <>
                      {" "}
                      in {search.pincodes.length} selected{" "}
                      {search.pincodes.length === 1 ? "PIN code" : "PIN codes"}
                    </>
                  )}
                </>
              )}
            </p>
          </div>
          <a
            className="source-link"
            href={endpoints.directory.link(search.city, search.name)}
            target="_blank"
            rel="noreferrer"
          >
            Pluxee directory <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>

        {isError && (
          <div className="status-panel" role="alert">
            <h3>Couldn’t load the directory</h3>
            <p>Try again or open the Pluxee directory directly.</p>
            <Button
              className="page-button"
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {data && data.total === 0 && (
          <div className="status-panel">
            <h3>No directory match</h3>
            <p>
              Try a shorter outlet name or clear your filters. You can also ask
              the outlet directly.
            </p>
          </div>
        )}

        {data && data.merchants.length > 0 && (
          <ul className="merchant-list" aria-label="Meal Card outlets">
            {data.merchants.map((merchant) => (
              <MerchantCard key={merchant.id} merchant={merchant} />
            ))}
          </ul>
        )}

        {data && data.pageCount > 1 && (
          <nav className="pagination" aria-label="Results pages">
            <Button
              className="page-button"
              type="button"
              disabled={data.page === 1}
              onClick={() => changePage(data.page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {data.page} of {data.pageCount}
            </span>
            <Button
              className="page-button"
              type="button"
              disabled={data.page >= data.pageCount}
              onClick={() => changePage(data.page + 1)}
            >
              Next
            </Button>
          </nav>
        )}
      </section>
    </>
  );
}

export function MerchantFinder() {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <Directory />
    </QueryClientProvider>
  );
}
