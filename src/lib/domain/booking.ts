export const BOOKING_STATUSES = [
  "booked",
  "arrived",
  "in_progress",
  "quality_check",
  "finished",
  "paid",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const WORKFLOW_STATUSES = [
  "booked",
  "arrived",
  "in_progress",
  "quality_check",
  "finished",
  "paid",
] as const;

export const WORKFLOW_LABELS: Record<BookingStatus, string> = {
  booked: "Booked",
  arrived: "Arrived",
  in_progress: "In Progress",
  quality_check: "Quality Check",
  finished: "Finished",
  paid: "Paid",
  cancelled: "Cancelled",
};
