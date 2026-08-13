type EventLifecycleInput = {
  status?: string | null;
  event_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  end_time?: string | null;
};

export function getEventEndAt(event: EventLifecycleInput) {
  if (event.end_date) {
    const value = new Date(event.end_date);
    if (!Number.isNaN(value.getTime())) return value;
  }
  const date = event.event_date || event.start_date?.slice(0, 10);
  if (!date) return null;
  const time = event.end_time?.slice(0, 8) || "23:59:59";
  const value = new Date(`${date.slice(0, 10)}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function isEventClosed(event: EventLifecycleInput, now = new Date()) {
  if (["completed", "closed", "cancelled", "archived"].includes(String(event.status || "").toLowerCase())) return true;
  const endAt = getEventEndAt(event);
  return Boolean(endAt && endAt.getTime() < now.getTime());
}
