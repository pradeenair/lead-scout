// src/app/api/apollo/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * .env.local MUST contain:
 * RAPIDAPI_KEY=...
 * RAPIDAPI_HOST=apollo-api-pro.p.rapidapi.com
 * RAPIDAPI_BASE=https://apollo-api-pro.p.rapidapi.com
 */

const BASE = process.env.RAPIDAPI_BASE!;
const HOST = process.env.RAPIDAPI_HOST!;
const KEY  = process.env.RAPIDAPI_KEY!;

/** Allowed GET endpoints */
const ALLOWGET = new Set<string>(["apolloaccounts", "industries", "page"]);

/** Helpers */
function extractList(x: any): any[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.results)) return x.results;
  if (Array.isArray(x?.data)) return x.data;
  return [x]; // single object → wrap
}
function takeFirst<T>(arr: unknown, n = 5): T[] {
  return Array.isArray(arr) ? (arr as T[]).slice(0, n) : [];
}

export async function POST(req: NextRequest) {
  try {
    if (!BASE || !HOST || !KEY) {
      return NextResponse.json(
        { error: "Server misconfigured. Set RAPIDAPI_KEY / HOST / BASE in .env.local" },
        { status: 500 }
      );
    }

    const { endpoint, params } = (await req.json()) as {
      endpoint?: string;
      params?: Record<string, any>;
    };

    if (!endpoint || !ALLOWGET.has(endpoint)) {
      return NextResponse.json({ error: "Unsupported or missing endpoint" }, { status: 400 });
    }

    // Build URL exactly like RapidAPI snippets (GET + query)
    const url = new URL(`${BASE}/${endpoint}`);

    if (endpoint === "apolloaccounts") {
      // ONLY name is supported here (per working snippet)
      const name = String(params?.name ?? "").trim();
      if (!name) {
        return NextResponse.json({ error: "Missing required param: name" }, { status: 400 });
      }
      url.searchParams.set("name", name);
    } else if (endpoint === "industries") {
      // no required params
    } else if (endpoint === "page") {
      // Allow only documented keys
      const allowed = [
        "qKeywords",
        "locations",
        "industry",
        "numEmployees",
        "personTitle",
        "revenueRangeMin",
        "revenueRangeMax",
        "next", // pagination token
      ];
      for (const k of allowed) {
        const v = params?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const headers: Record<string, string> = {
      "x-rapidapi-key": KEY,
      "x-rapidapi-host": HOST,
    };

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const upstreamText = await upstream.text();

    if (!upstream.ok) {
      // Surface provider error clearly during dev
      console.error("UPSTREAM ERROR", upstream.status, upstreamText);
      let payload: any;
      try { payload = JSON.parse(upstreamText); } catch { payload = { rawText: upstreamText }; }
      return NextResponse.json(
        { error: "Upstream error", status: upstream.status, data: payload },
        { status: 502 }
      );
    }

    // Parse JSON (fallback to text if necessary)
    let parsed: any;
    try { parsed = JSON.parse(upstreamText); } catch { parsed = upstreamText; }

    // ---- Normalization ----
    if (endpoint === "apolloaccounts") {
      const list = extractList(parsed);
      const items = takeFirst(list, 5).map((r: any) => ({
        name: r?.name ?? r?.company ?? null,
        domain: r?.domain ?? r?.websiteUrl ?? r?.website ?? null,
        websiteUrl: r?.websiteUrl ?? r?.website ?? null,
        logoUrl: r?.logoUrl ?? null,
        size: r?.size ?? r?.employee_count ?? null,
        industry: r?.industry ?? null,
        linkedin: r?.linkedin_url ?? r?.linkedin ?? null,
        id: r?.id ?? null,
      }));
      return NextResponse.json({ ok: true, count: items.length, items });
    }

    if (endpoint === "industries") {
      const list = extractList(parsed);
      const items = takeFirst(list, 50).map((r: any) => ({
        id: r?.id ?? r,
        name: r?.name ?? r,
      }));
      return NextResponse.json({ ok: true, count: items.length, items });
    }

    // endpoint === "page"
    {
      // Prefer documented container: people[]
      const rawPeople = Array.isArray((parsed as any)?.people)
        ? (parsed as any).people
        : extractList(parsed);

      const items = takeFirst(rawPeople, 5).map((r: any) => ({
        // Name: name OR first+last OR first
        name: r?.name ?? ((r?.firstName && r?.lastName) ? `${r.firstName} ${r.lastName}` : (r?.firstName ?? null)),
        title: r?.title ?? r?.personTitle ?? null,
        company: r?.organizationName ?? r?.company ?? r?.companyName ?? null,
        domain: r?.organizationWebsiteUrl ?? r?.domain ?? r?.websiteUrl ?? null,
        linkedin: r?.linkedinUrl ?? r?.organizationLinkedinUrl ?? r?.linkedin ?? null,
        phone: r?.organizationPhone ?? r?.phone ?? null,
        location:
          (r?.city && r?.country) ? `${r.city}, ${r.country}`
          : (r?.city ?? r?.country ?? r?.state ?? null),
        email: r?.email ?? null,             // likely empty on RapidAPI plan
        about: r?.organizationAbout ?? null, // org description if present
      }));

      return NextResponse.json({ ok: true, count: items.length, items });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown server error" }, { status: 500 });
  }
}
