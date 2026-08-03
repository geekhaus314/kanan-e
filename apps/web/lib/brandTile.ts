const BRAND_TILE: Record<string, string> = {
  ZYN: "/brand-assets/brands/zyn.svg",
  MARLB: "/brand-assets/brands/marlboro.svg",
  NWPT: "/brand-assets/brands/newport.svg",
  CAMEL: "/brand-assets/brands/camel.svg",
  RAW: "/brand-assets/brands/raw.svg",
  GEEK: "/brand-assets/brands/geekbar.svg",
  JUICE: "/brand-assets/brands/juicehead.svg",
  ZIPPO: "/brand-assets/brands/zippo.svg",
  BLKMLD: "/brand-assets/brands/blackmild.svg",
  SWISH: "/brand-assets/brands/swisher.svg",
};

export function brandTileFor(sku?: string | null): string {
  if (!sku) return "/brand-assets/brands/ud.svg";
  const key = Object.keys(BRAND_TILE).find((k) => sku.toUpperCase().startsWith(k));
  return key ? BRAND_TILE[key]! : "/brand-assets/brands/ud.svg";
}
