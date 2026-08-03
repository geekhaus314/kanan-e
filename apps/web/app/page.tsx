import { redirect } from "next/navigation";

// Single-tenant storefront: the root domain IS United Distribution.
// The multi-tenant data model stays intact (apps/web/app/[merchant]) so a
// second tenant can be added later as data + a route — but the public root
// now lands on the live store instead of the generic platform splash.
export default function RootRedirect() {
  redirect("/united");
}
