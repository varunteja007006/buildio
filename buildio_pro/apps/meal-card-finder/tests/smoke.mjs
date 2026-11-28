import assert from "node:assert/strict";
import { argv } from "node:process";

const root = argv[2];
assert.ok(root, "Pass the URL of a running Meal Card Finder.");

async function search(params, status = 200, path = "/api/merchants") {
  const url = new URL(path, root);
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    signal: globalThis.AbortSignal.timeout(25000),
  });
  const body = await response.text();
  assert.equal(response.status, status, `${url}: ${body.slice(0, 500)}`);
  return JSON.parse(body);
}

const home = await fetch(root, {
  signal: globalThis.AbortSignal.timeout(25000),
});
assert.equal(home.status, 200);
const html = await home.text();
assert.match(html, /Filter outlets/);
assert.match(html, /Other city/);
assert.match(html, /Search or select PIN codes/);

for (const city of ["chennai", "hyderabad", "bengaluru", "pune"]) {
  const result = await search({ city });
  assert.ok(result.total > 0, city);
  assert.match(result.merchants[0].address, new RegExp(city, "i"));
  assert.ok(result.pageCount > 1, city);
}

const matches = await search({ city: "chennai", name: "barbeque nation" });
assert.ok(
  matches.merchants.some(
    ({ address, directionsUrl }) =>
      /th[ou]raipakkam/i.test(address) && directionsUrl,
  ),
);
const noMatch = await search({
  city: "chennai",
  name: "meal-finder-smoke-93cdd680",
});
assert.deepEqual(noMatch, { merchants: [], total: 0, page: 1, pageCount: 0 });

const first = await search({ city: "chennai" });
const second = await search({ city: "chennai", page: "2" });
assert.equal(second.page, 2);
assert.notEqual(first.merchants[0].id, second.merchants[0].id);
await search({ city: "invalid" }, 400);
await search({ city: "pune", page: "0" }, 400);

const pinCodesPath = "/api/merchants/pincodes";
const otherCities = await search({}, 200, "/api/merchants/cities");
assert.ok(otherCities.includes("New Delhi"));
assert.ok(!otherCities.includes("Chennai"));
const otherCity = { city: "New Delhi" };
const otherCityResults = await search(otherCity);
assert.ok(otherCityResults.total > 0);
assert.match(otherCityResults.merchants[0].address, /New Delhi/);
const otherCityPins = await search(otherCity, 200, pinCodesPath);
assert.match(otherCityPins[0], /^[1-9]\d{5}$/);
const otherCityFiltered = await search({
  ...otherCity,
  pincodes: otherCityPins[0],
});
assert.ok(otherCityFiltered.total > 0);
assert.ok(
  otherCityFiltered.merchants.every(({ address }) =>
    address.endsWith(otherCityPins[0]),
  ),
);

const chennaiPins = await search({ city: "chennai" }, 200, pinCodesPath);
assert.ok(chennaiPins.includes("600096") && chennaiPins.includes("600061"));
const bengaluruPins = await search({ city: "bengaluru" }, 200, pinCodesPath);
assert.ok(bengaluruPins.includes("560038"));
assert.ok(!bengaluruPins.includes("600096"));

const filterByPins = (pincodes, name = "", page = "1") =>
  search({ city: "chennai", pincodes, name, page });
const pinA = await filterByPins("600096");
const pinB = await filterByPins("600061");
const combined = await filterByPins("600096,600061");
assert.ok(pinA.total > 0 && pinB.total > 0);
assert.equal(combined.total, pinA.total + pinB.total);
assert.ok(
  combined.merchants.every(({ address }) => /600096$|600061$/.test(address)),
);
const nextPinsPage = await filterByPins("600096,600061", "", "2");
assert.equal(nextPinsPage.page, 2);
assert.notEqual(nextPinsPage.merchants[0].id, combined.merchants[0].id);
const outletInPin = await filterByPins("600096", "Barbeque Nation");
assert.ok(
  outletInPin.merchants.some(({ address }) => /th[ou]raipakkam/i.test(address)),
);
await search({ city: "chennai", pincodes: "123" }, 400);

console.log("Meal Card Finder smoke checks passed.");
