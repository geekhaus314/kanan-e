import { redirect } from "next/navigation";

export default function PlatformLanding() {
  // Server-side redirect to the tenant storefront
  redirect('/united');
}
