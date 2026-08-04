const promos = [
  "Free shipping on wholesale orders over $2,500",
  "Geek Bar Meloso Max — 9000 puffs now in stock",
  "ZYN Cool Mint 6mg — FDA-authorized, bulk pricing available",
  "New: RAZ TN9000 with HD screen display",
  "Wholesale tiers: Save up to 15% on orders of 100+ units",
  "Puffco Peak Pro 3DXL — Smart rig now available for resale",
  "Authorized retailer of authentic Geek Bar products",
  "Black & Mild 25ct boxes — Wine & Jazz flavors in stock",
];

export function PromoBanner() {
  const items = [...promos, ...promos]; // duplicate for seamless loop
  return (
    <div className="bg-brand-600 text-white py-2.5 overflow-hidden relative">
      <div className="marquee-track">
        {items.map((text, i) => (
          <span
            key={i}
            className="text-sm font-medium whitespace-nowrap px-8 flex items-center gap-3"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-200" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
