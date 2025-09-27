"use client";

import { useEffect, useRef, useState } from "react";

type PersonRow = {
  name: string | null;
  title: string | null;
  company: string | null;
  domain: string | null;
  linkedin: string | null;
  phone: string | null;
  location: string | null;
  email?: string | null;
  about?: string | null;
};

type IndustryRow = { id: string | number | null; name: string | null };

export default function Home() {
  const toolRef = useRef<HTMLDivElement | null>(null);

  // People form state
  const [qKeywords, setQKeywords] = useState("");
  const [locations, setLocations] = useState("");
  const [industry, setIndustry] = useState(""); // single-select
  const [personTitle, setPersonTitle] = useState("");
  const [numEmployees, setNumEmployees] = useState("");
  const [revenueMin, setRevenueMin] = useState<string>("");
  const [revenueMax, setRevenueMax] = useState<string>("");

  // Data/UI
  const [industryOptions, setIndustryOptions] = useState<IndustryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peopleRows, setPeopleRows] = useState<PersonRow[]>([]);

  // Load industries once to power dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/apollo", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: "industries", params: {} }),
        });
        const json = await res.json();
        if (json?.ok && Array.isArray(json.items)) setIndustryOptions(json.items);
      } catch {
        // ignore
      }
    })();
  }, []);

  async function runPeople(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPeopleRows([]);
    try {
      const params: Record<string, string | number> = {};
      if (qKeywords.trim()) params.qKeywords = qKeywords.trim();
      if (locations.trim()) params.locations = locations.trim();
      if (industry.trim()) params.industry = industry.trim();
      if (personTitle.trim()) params.personTitle = personTitle.trim();
      if (numEmployees.trim()) params.numEmployees = numEmployees.trim();
      if (revenueMin.trim()) params.revenueRangeMin = Number(revenueMin);
      if (revenueMax.trim()) params.revenueRangeMax = Number(revenueMax);

      const res = await fetch("/api/apollo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: "page", params }),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) {
        setError(JSON.stringify(json, null, 2));
        return;
      }
      setPeopleRows(json?.items ?? []);
    } catch (err) {
      const e = err as Error;
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const scrollToTool = () => {
    toolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-dvh bg-white text-gray-900">
      {/* ... unchanged UI code ... */}
    </main>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  full = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  full?: boolean;
}) {
  return (
    <label className={`text-sm ${full ? "md:col-span-2" : ""}`}>
      {label}
      <input
        className="mt-1 w-full rounded-xl border p-2"
        placeholder={placeholder}
        value={value}
        type={type}
        min={type === "number" ? 0 : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border p-5 shadow-sm">
      <div className="font-medium">{title}</div>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border p-5 bg-white shadow-sm">
      <div className="font-medium">{q}</div>
      <p className="mt-2 text-gray-600">{a}</p>
    </div>
  );
}
