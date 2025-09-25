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
      const params: Record<string, any> = {};
      if (qKeywords.trim()) params.qKeywords = qKeywords.trim();
      if (locations.trim()) params.locations = locations.trim(); // semicolon-separated supported
      if (industry.trim()) params.industry = industry.trim();     // from dropdown
      if (personTitle.trim()) params.personTitle = personTitle.trim(); // semicolon-separated supported
      if (numEmployees.trim()) params.numEmployees = numEmployees.trim(); // e.g. 1,10;11,20
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
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const scrollToTool = () => {
    toolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-dvh bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur bg-white/75 border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-black" />
            <span className="font-semibold">Apollo Mini</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:opacity-70">Features</a>
            <button onClick={scrollToTool} className="hover:opacity-70">Prospect Finder</button>
            <a href="#faq" className="hover:opacity-70">FAQ</a>
          </div>
          <button
            onClick={scrollToTool}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm"
          >
            Launch Tool
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              Find relevant people fast.
            </h1>
            <p className="mt-4 text-gray-600">
              Zero-setup prospect finder powered by a RapidAPI Apollo wrapper.
              Filter by keywords, locations, industries, titles, company size, and revenue.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={scrollToTool}
                className="rounded-xl bg-black text-white px-5 py-2.5"
              >
                Start Searching
              </button>
              <a href="#features" className="rounded-xl border px-5 py-2.5">
                See Features
              </a>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Emails are generally not returned on this plan; use for prospecting/shortlisting.
            </p>
          </div>
          <div className="rounded-3xl border shadow-sm p-4">
            {/* Simple static preview card */}
            <div className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Prospect Finder</div>
                <div className="text-xs text-gray-500">Live Preview</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-gray-50 p-2">Keywords: <b>marketing</b></div>
                <div className="rounded-lg bg-gray-50 p-2">Location: <b>USA</b></div>
                <div className="rounded-lg bg-gray-50 p-2">Industry: <b>Construction</b></div>
                <div className="rounded-lg bg-gray-50 p-2">Title: <b>Manager</b></div>
              </div>
              <div className="mt-3 rounded-lg bg-gray-100 p-3 text-xs">
                Returns up to 5 results per search (app-side cap).
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 border-y">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-3 gap-6">
          <Feature title="Focused filters" desc="Keywords, locations, industry, titles, company size ranges, revenue brackets (USD)." />
          <Feature title="Fast & simple" desc="Single-page app with a clean form and instant results. No logins or cookies." />
          <Feature title="Credit-friendly" desc="We cap results to five to conserve free-tier credits while you test." />
        </div>
      </section>

      {/* Tool */}
      <section ref={toolRef} className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 grid lg:grid-cols-2 gap-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Prospect Finder</h2>
            <p className="text-gray-600 text-sm">
              Use semicolons for multiple values (e.g., <code>USA;India</code>).
              Revenue values are entered as whole numbers in <b>USD</b>.
            </p>
            <form onSubmit={runPeople} className="mt-4 space-y-4 rounded-2xl border p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <LabeledInput
                  label="Keywords"
                  placeholder="e.g., marketing"
                  value={qKeywords}
                  onChange={setQKeywords}
                />
                <LabeledInput
                  label="Locations (semicolon-separated)"
                  placeholder="e.g., USA;India"
                  value={locations}
                  onChange={setLocations}
                />
                <label className="text-sm">
                  Industry
                  <select
                    className="mt-1 w-full rounded-xl border p-2"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Any</option>
                    {industryOptions.map((opt, idx) => (
                      <option key={idx} value={opt.name ?? ""}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </label>
                <LabeledInput
                  label="Job titles (semicolon-separated)"
                  placeholder="e.g., Marketing Manager;HR Manager"
                  value={personTitle}
                  onChange={setPersonTitle}
                />
                <LabeledInput
                  label="Company sizes (semicolon-separated ranges)"
                  placeholder="e.g., 1,10;11,20;21,50;51,100"
                  value={numEmployees}
                  onChange={setNumEmployees}
                  full
                />
                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <LabeledInput
                    label="Revenue min (USD)"
                    placeholder="e.g., 100000"
                    type="number"
                    value={revenueMin}
                    onChange={setRevenueMin}
                  />
                  <LabeledInput
                    label="Revenue max (USD)"
                    placeholder="e.g., 1000000"
                    type="number"
                    value={revenueMax}
                    onChange={setRevenueMax}
                  />
                </div>
              </div>

              <button
                className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search People"}
              </button>

              {error && (
                <pre className="rounded-xl bg-red-50 p-3 text-red-700 whitespace-pre-wrap break-words text-xs">
                  {error}
                </pre>
              )}
            </form>
          </div>

          <div className="rounded-2xl border shadow-sm p-4">
            <h3 className="font-medium mb-3">Results</h3>
            {peopleRows.length === 0 ? (
              <p className="text-sm text-gray-600">No results yet.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Company</th>
                      <th className="py-2 pr-4">Domain</th>
                      <th className="py-2 pr-4">Location</th>
                      <th className="py-2">LinkedIn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peopleRows.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2 pr-4">{r.name ?? "-"}</td>
                        <td className="py-2 pr-4">{r.title ?? "-"}</td>
                        <td className="py-2 pr-4">{r.company ?? "-"}</td>
                        <td className="py-2 pr-4">{r.domain ?? "-"}</td>
                        <td className="py-2 pr-4">{r.location ?? "-"}</td>
                        <td className="py-2">
                          {r.linkedin ? (
                            <a className="text-blue-600 underline" href={r.linkedin} target="_blank" rel="noreferrer">
                              Open
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-gray-500">
                  Showing at most 5 rows (server-capped).
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50 border-t">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <FaqItem q="Does this return emails?" a="Not on this plan. You’ll get names, titles, organizations, LinkedIn URLs and related fields for prospecting." />
            <FaqItem q="What currency are revenues in?" a="USD. Enter whole numbers (e.g., 100000 for $100k)." />
            <FaqItem q="How many results will I see?" a="Up to five per search, capped in the app to conserve credits." />
            <FaqItem q="Can I search multiple locations or titles?" a="Yes. Use semicolons between values (e.g., USA;India or Marketing Manager;HR Manager)." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Apollo Mini</span>
          <span>For compliant prospecting only.</span>
        </div>
      </footer>
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
