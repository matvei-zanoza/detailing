import { format } from "date-fns";

export function todayISODate() {
  return format(new Date(), "yyyy-MM-dd");
}

export function monthStartISODate() {
  const d = new Date();
  d.setDate(1);
  return format(d, "yyyy-MM-dd");
}
