// Status color mapping for badges
export function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    booked: "bg-muted text-muted-foreground",
    arrived: "bg-primary/15 text-primary",
    in_progress: "bg-warning/15 text-warning",
    quality_check: "bg-accent/15 text-accent",
    finished: "bg-success/15 text-success",
    paid: "bg-success/20 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return styles[status] || "bg-muted text-muted-foreground";
}
