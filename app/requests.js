// Follow-up statuses for free session requests (admin panel + /api/admin).
export const REQUEST_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "call_later", label: "Call later" },
  { value: "not_interested", label: "Not interested" },
];

// Today's date (YYYY-MM-DD) in India time, for comparing with follow-up dates.
export const todayIST = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
