export interface AssetCatalogItem {
  id: string;
  name: string;
  description: string;
  price: bigint;
}

export const ASSET_CATALOG: AssetCatalogItem[] = [
  {
    id: "starter-template-pack",
    name: "Starter Template Pack",
    description: "Production-ready boilerplates for auth and payments flows.",
    price: 120n,
  },
  {
    id: "api-observability-kit",
    name: "API Observability Kit",
    description: "Structured logs, traces, and dashboard presets for services.",
    price: 180n,
  },
  {
    id: "secure-ci-bundle",
    name: "Secure CI Bundle",
    description: "CI templates with SAST, dependency checks, and release gates.",
    price: 250n,
  },
  {
    id: "growth-analytics-pack",
    name: "Growth Analytics Pack",
    description: "Event taxonomy and growth dashboard starter assets.",
    price: 90n,
  },
];

export const getAssetById = (id: string) => {
  return ASSET_CATALOG.find((asset) => asset.id === id);
};
