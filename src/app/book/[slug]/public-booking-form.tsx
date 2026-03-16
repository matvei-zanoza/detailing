"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { createPublicBooking } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ItemOption = { id: string; label: string; priceLabel?: string };

export function PublicBookingForm({
  studioSlug,
  services,
  packages,
}: {
  studioSlug: string;
  services: ItemOption[];
  packages: ItemOption[];
}) {
  const OPEN_HOUR = 10;
  const CLOSE_HOUR = 19;

  const [isPending, setIsPending] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [notes, setNotes] = useState("");

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [durationHours, setDurationHours] = useState<1 | 2>(2);

  const [itemType, setItemType] = useState<"service" | "package">("service");
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? "");
  const [packageId, setPackageId] = useState<string>(packages[0]?.id ?? "");

  const timeOptions = useMemo(() => {
    const list: string[] = [];
    for (let h = OPEN_HOUR; h <= CLOSE_HOUR - 1; h++) {
      list.push(`${String(h).padStart(2, "0")}:00`);
    }
    return list;
  }, []);

  const windowEnd = useMemo(() => {
    const h = Number(startTime.slice(0, 2));
    const endH = h + durationHours;
    return `${String(endH).padStart(2, "0")}:00`;
  }, [startTime, durationHours]);

  const duration2Allowed = useMemo(() => {
    const h = Number(startTime.slice(0, 2));
    return h + 2 <= CLOSE_HOUR;
  }, [startTime]);

  const showClosingNote = useMemo(() => {
    const endH = Number(windowEnd.slice(0, 2));
    return endH === CLOSE_HOUR;
  }, [windowEnd]);

  async function submit() {
    setIsPending(true);
    try {
      const payload = {
        studio_slug: studioSlug,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail ? customerEmail : null,
        car_brand: carBrand ? carBrand : null,
        car_model: carModel ? carModel : null,
        booking_date: date,
        start_time: startTime,
        duration_hours: durationHours,
        item_type: itemType,
        service_id: itemType === "service" ? (serviceId || null) : null,
        package_id: itemType === "package" ? (packageId || null) : null,
        notes: notes ? notes : null,
        hp: "",
      };

      const res = await createPublicBooking(payload);
      if (!res.ok) {
        throw new Error("Failed");
      }

      toast.success("Booking confirmed");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCarBrand("");
      setCarModel("");
      setNotes("");
    } catch (e) {
      toast.error("Submit failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Email (optional)</Label>
          <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Start hour</Label>
          <Select value={startTime} onValueChange={(v) => {
            setStartTime(v);
            const h = Number(v.slice(0, 2));
            if (durationHours === 2 && h + 2 > CLOSE_HOUR) {
              setDurationHours(1);
            }
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Window</Label>
          <Select value={String(durationHours)} onValueChange={(v) => setDurationHours((Number(v) as any) === 1 ? 1 : 2)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hour</SelectItem>
              <SelectItem value="2" disabled={!duration2Allowed}>
                2 hours
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Preferred drop-off window</Label>
          <Input value={`${startTime}–${windowEnd}`} disabled />
          {showClosingNote && (
            <div className="text-xs text-muted-foreground">Pick-up by 19:00 (closing time).</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={itemType} onValueChange={(v) => setItemType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="package">Package</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{itemType === "service" ? "Service" : "Package"}</Label>
          {itemType === "service" ? (
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}{s.priceLabel ? ` • ${s.priceLabel}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}{p.priceLabel ? ` • ${p.priceLabel}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Car brand (optional)</Label>
          <Input value={carBrand} onChange={(e) => setCarBrand(e.target.value)} placeholder="e.g. Toyota" />
        </div>
        <div className="space-y-2">
          <Label>Car model (optional)</Label>
          <Input value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="e.g. Camry" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end">
        <Button disabled={isPending || !customerName || !customerPhone} onClick={submit}>
          {isPending ? "Submitting…" : "Book"}
        </Button>
      </div>
    </div>
  );
}
