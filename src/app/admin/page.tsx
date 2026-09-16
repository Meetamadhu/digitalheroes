import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Control centre</h1>
      <p className="mt-2 text-zinc-400">
        Manage users, monthly draws, charities, winner verification, and reports.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          ["/admin/users", "User management"],
          ["/admin/draws", "Draw management"],
          ["/admin/charities", "Charity listings"],
          ["/admin/winners", "Winners & payouts"],
          ["/admin/reports", "Reports & analytics"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="block rounded-xl border border-white/10 px-4 py-3 hover:border-[#ff6b4a]/40"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
