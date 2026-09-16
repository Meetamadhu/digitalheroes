import { deleteCharity, saveCharity } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";
import type { Charity } from "@/types/database";

export default async function AdminCharitiesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("charities").select("*").order("name");
  const charities = (data ?? []) as Charity[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Charities</h1>
      <form action={saveCharity} className="mt-8 space-y-3 rounded-2xl border border-white/10 p-5">
        <h2 className="font-medium text-white">Add charity</h2>
        <input name="name" required placeholder="Name" className="w-full rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm" />
        <input name="slug" required placeholder="slug" className="w-full rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm" />
        <textarea name="description" placeholder="Description" className="w-full rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm" />
        <input name="image_url" placeholder="Image URL" className="w-full rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input name="featured" type="checkbox" /> Featured on homepage
        </label>
        <button type="submit" className="rounded bg-[#ff6b4a]/20 px-4 py-2 text-sm text-[#ffb347]">
          Create
        </button>
      </form>
      <ul className="mt-10 space-y-6">
        {charities.map((c) => (
          <li key={c.id} className="rounded-2xl border border-white/10 p-5">
            <form action={saveCharity} className="space-y-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} className="w-full rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm" />
              <input name="slug" defaultValue={c.slug} className="w-full rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm" />
              <textarea name="description" defaultValue={c.description} className="w-full rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm" />
              <input name="image_url" defaultValue={c.image_url ?? ""} className="w-full rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input name="featured" type="checkbox" defaultChecked={c.featured} /> Featured
              </label>
              <button type="submit" className="rounded bg-white/10 px-4 py-2 text-sm">
                Save
              </button>
            </form>
            <form action={deleteCharity} className="mt-2">
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" className="text-sm text-red-400">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
