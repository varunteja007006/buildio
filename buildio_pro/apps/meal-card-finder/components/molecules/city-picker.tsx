"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@workspace/ui/components/combobox";
import { useState } from "react";

import { directoryCitiesQuery } from "@/api/merchants/query";
import { isQuickCity, type City } from "@/api/merchants/types";

export function CityPicker({
  value,
  onChange,
}: {
  value: City;
  onChange: (city: City) => void;
}) {
  const [requested, setRequested] = useState(false);
  const { data, isError, isPending, refetch } = useQuery({
    ...directoryCitiesQuery(),
    enabled: requested,
  });
  const cities = data ?? [];

  return (
    <div className="other-city-picker">
      <label id="other-city-label" htmlFor="other-city">
        Other city (optional)
      </label>
      <Combobox
        items={cities}
        value={isQuickCity(value) ? null : value}
        limit={50}
        onValueChange={(city) => {
          if (city) onChange(city);
        }}
        onOpenChange={(open) => {
          if (!open) return;
          setRequested(true);
          if (isError) void refetch();
        }}
      >
        <ComboboxTrigger
          render={
            <Button
              aria-labelledby="other-city-label other-city-value"
              className="other-city-trigger"
              variant="outline"
            />
          }
        >
          <span id="other-city-value">
            <ComboboxValue placeholder="Search cities" />
          </span>
        </ComboboxTrigger>
        <ComboboxContent className="city-popup">
          <ComboboxInput
            aria-label="Search other cities"
            id="other-city"
            className="city-search-input"
            placeholder="Type a city name"
            showTrigger={false}
          />
          {isError ? (
            <div className="city-picker-state" role="status">
              Couldn’t load cities.{" "}
              <button type="button" onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          ) : (
            <ComboboxEmpty className="city-picker-empty">
              {isPending ? "Loading cities…" : "No matching cities"}
            </ComboboxEmpty>
          )}
          <ComboboxList className="city-picker-list">
            {(city: City) => (
              <ComboboxItem
                className="city-picker-option"
                key={city}
                value={city}
              >
                {city}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
