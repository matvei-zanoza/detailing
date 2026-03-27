import Link from "next/link";
import { Users, Search, Tag, CalendarDays } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CustomerDialog } from "./customer-dialog";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestLocale();
  const { supabase, profile } = await requireProfile();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();

  let query = supabase
    .from("customers")
    .select("id, display_name, created_at")
    .eq("studio_id", profile.studio_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.ilike("display_name", `%${q}%`);
  }

  const customers = await query;

  const tagAssignments = await supabase
    .from("customer_tag_assignments")
    .select("customer_id, customer_tags(name)")
    .eq("studio_id", profile.studio_id)
    .limit(500);

  const tagMap = new Map<string, string[]>();
  for (const row of tagAssignments.data ?? []) {
    const tags = row.customer_tags as any;
    const name = Array.isArray(tags) ? tags[0]?.name : tags?.name;
    if (!name) continue;
    const list = tagMap.get(row.customer_id) ?? [];
    if (!list.includes(name)) list.push(name);
    tagMap.set(row.customer_id, list);
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {tServer(locale, "customers.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {tServer(locale, "customers.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{(customers.data ?? []).length}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {tServer(locale, "customers.total")}
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-lg font-semibold">{tServer(locale, "customers.directory")}</CardTitle>
            <div className="flex items-center gap-3">
              <CustomerDialog
                triggerLabel={tServer(locale, "customers.new")}
                title={tServer(locale, "customers.new")}
              />
              <form action="/customers" className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder={tServer(locale, "customers.searchPlaceholder")}
                  defaultValue={q}
                  className="h-9 w-full bg-muted/30 pl-9 lg:w-[280px]"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                {tServer(locale, "customers.search")}
              </Button>
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "dashboard.customer")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "customers.tags")}
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "customers.since")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(customers.data ?? []).map((c) => {
                const tags = tagMap.get(c.id) ?? [];
                return (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <Link
                        href={`/customers/${c.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {c.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground group-hover:text-primary group-hover:underline">
                          {c.display_name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {t}
                          </span>
                        ))}
                        {tags.length === 0 && (
                          <span className="text-xs text-muted-foreground/60">{tServer(locale, "customers.noTags")}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {String(c.created_at).slice(0, 10)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(customers.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                        <Users className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tServer(locale, "customers.emptyTitle")}</p>
                        <p className="text-sm text-muted-foreground">
                          {q
                            ? tServer(locale, "customers.emptyHintSearch")
                            : tServer(locale, "customers.emptyHintStart")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
