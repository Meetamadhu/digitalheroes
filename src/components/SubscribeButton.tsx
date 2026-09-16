"use client";

import { useState } from "react";

type Plan = "monthly" | "yearly";

export function SubscribeButton({ plan, label }: { plan: Plan; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 503) {
        const demo = await fetch("/api/dev/activate-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const demoData = await demo.json();
        if (demo.ok) {
          window.location.href = "/dashboard";
          return;
        }
        setError(demoData.error ?? "Demo subscribe failed.");
        return;
      }
      setError(data.error ?? "Checkout failed.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={checkout}
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#ffb347] px-6 py-3 font-semibold text-[#0c0f14] hover:brightness-110 disabled:opacity-60 transition"
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
