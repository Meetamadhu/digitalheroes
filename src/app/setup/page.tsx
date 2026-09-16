import { SetupRequired } from "@/components/SetupRequired";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SetupRequired next={next} />;
}
