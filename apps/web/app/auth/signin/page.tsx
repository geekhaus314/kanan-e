import { redirect } from "next/navigation";

export default function RootSignInPage() {
  redirect("/united/auth/signin");
}
