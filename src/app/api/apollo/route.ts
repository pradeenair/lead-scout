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
const KEY = process.env.RAPIDAPI_KEY!;

/** Allowed GET endpoints */
const ALLOWGET = new Set<string>(["apolloaccounts", "industries", "page"]);

/** Helpers */
function extractList(x: unknown): unknown[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (typeof x === "object" && x !== null) {
    const obj = x as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.data)) return obj.data;
  }
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

    const body = (await req.json()) as {
      endpoint?: string;
      params?: Record<string, string | number | undefined>;
    };
    const { endpoint, params } = body;

    if (!endpoint || !ALLOWGET.has(endpoint)) {
      return NextResponse.json({ error: "Unsupported or missing endpoint" }, { status: 400 });
    }

    // Build URL exactly like RapidAPI snippets (GET + query)
    const url = new URL(`${BASE}/${endpoint}`);

    if (endpoint === "apolloaccounts") {
      const name = String(params?.name ?? "").trim();
      if (!name) {
        return NextResponse.json({ error: "Missing required param: name" }, { status: 400 });
      }
      url.searchParams.set("name", name);
    } else if (endpoint === "page") {
      const allowed = [
        "qKeywords",
        "locations",
        "industry",
        "numEmployees",
        "personTitle",
        "revenueRangeMin",
        "revenueRangeMax",
        "next", // pagination token
      ] as const;
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
      console.error("UPSTREAM ERROR", upstream.status, upstreamText);
      let payload: unknown;
      try {
        payload = JSON.parse(upstreamText);
      } catch {
        payload = { rawText: upstreamText };
      }
      return NextResponse.json(
        { error: "Upstream error", status: upstream.status, data: payload },
        { status: 502 }
      );
    }

    // Parse JSON (fallback to text if necessary)
    let parsed: unknown;
    try {
      parsed = JSON.parse(upstreamText);
    } catch {
      parsed = upstreamText;
    }

    // ---- Normalization ----
    if (endpoint === "apolloaccounts") {
      const list = extractList(parsed);
      const items = takeFirst<Record<string, unknown>>(list, 5).map((r) => ({
        name: (r as any)?.name ?? (r as any)?.company ?? null,
        domain:
          (r as any)?.domain ??
          (r as any)?.websiteUrl ??
          (r as any)?.website ??
          null,
        websiteUrl: (r as any)?.websiteUrl ?? (r as any)?.website ?? null,
        logoUrl: (r as any)?.logoUrl ?? null,
        size: (r as any)?.size ?? (r as any)?.employee_count ?? null,
        industry: (r as any)?.industry ?? null,
        linkedin: (r as any)?.linkedin_url ?? (r as any)?.linkedin ?? null,
        id: (r as any)?.id ?? null,
      }));
      return NextResponse.json({ ok: true, count: items.length, items });
    }

    if (endpoint === "industries") {
      const list = extractList(parsed);
      const items = takeFirst<Record<string, unknown>>(list, 50).map((r) => ({
        id: (r as any)?.id ?? r,
        name: (r as any)?.name ?? r,
      }));
      return NextResponse.json({ ok: true, count: items.length, items });
    }

    // endpoint === "page"
    {
      const parsedObj = parsed as Record<string, unknown>;
      const rawPeople = Array.isArray(parsedObj?.people)
        ? (parsedObj.people as unknown[])
        : extractList(parsed);

      const items = takeFirst<Record<string, unknown>>(rawPeople, 5).map((r) => ({
        name:
          (r as any)?.name ??
          ((r as any)?.firstName && (r as any)?.lastName
            ? `${(r as any).firstName} ${(r as any).lastName}`
            : (r as any)?.firstName ?? null),
        title: (r as any)?.title ?? (r as any)?.personTitle ?? null,
        company:
          (r as any)?.organizationName ??
          (r as any)?.company ??
          (r as any)?.companyName ??
          null,
        domain:
          (r as any)?.organizationWebsiteUrl ??
          (r as any)?.domain ??
          (r as any)?.websiteUrl ??
          null,
        linkedin:
          (r as any)?.linkedinUrl ??
          (r as any)?.organizationLinkedinUrl ??
          (r as any)?.linkedin ??
          null,
        phone: (r as any)?.organizationPhone ?? (r as any)?.phone ?? null,
        location:
          (r as any)?.city && (r as any)?.country
            ? `${(r as any).city}, ${(r as any).country}`
            : (r as any)?.city ?? (r as any)?.country ?? (r as any)?.state ?? null,
        email: (r as any)?.email ?? null,
        about: (r as any)?.organizationAbout ?? null,
      }));

      return NextResponse.json({ ok: true, count: items.length, items });
    }
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message ?? "Unknown server error" }, { status: 500 });
  }
}
