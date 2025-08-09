"use client";

import manifest from "@/lib/tools/manifest.json";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const statusColor: Record<string, string> = {
  live: "bg-green-600",
  beta: "bg-amber-600",
  alpha: "bg-blue-600",
  draft: "bg-slate-500",
};

export default function DevTools() {
  const items = (manifest as any[]).sort((a, b) =>
    b.enabled === a.enabled ? a.slug.localeCompare(b.slug) : (b.enabled ? -1 : 1)
  );

  return (
    <main className="container py-10">
      <h1 className="mb-6 text-2xl font-bold">Tools Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Card key={t.slug}>
            <CardHeader>
              <CardTitle className="text-base">{t.title || t.slug}</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t.from?.toUpperCase?.()} → {t.to?.toUpperCase?.()}</span>
                <span>•</span>
                <span>{t.engine}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <Badge className={`${statusColor[t.status] || statusColor.draft} text-white`}>
                  {t.status}
                </Badge>
                {t.enabled === false && <Badge variant="outline">disabled</Badge>}
                {t.verified && <Badge variant="secondary">verified</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <Link className="underline" href={`/tools/${t.slug}`}>Open</Link>
                <span className="text-muted-foreground">kind: {t.kind}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}