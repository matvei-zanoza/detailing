import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <div className="text-sm text-muted-foreground">
          Search customers, view history, and track VIP/repeat tags.
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Customer list</CardTitle>
          <form action="/customers" className="flex gap-2">
            <Input
              name="q"
              placeholder="Search by name…"
              defaultValue={q}
              className="w-full md:w-[280px]"
            />
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(customers.data ?? []).map((c) => {
                const tags = tagMap.get(c.id) ?? [];
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.display_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                        {tags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {String(c.created_at).slice(0, 10)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(customers.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No customers found.
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
