import { redirect } from "next/navigation";

// The first screen of a fresh install is the setup.
export default function Home() {
  redirect("/setup");
}
