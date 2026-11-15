export function canResolveReport(role) {
  return role === "Safety Officer";
}

export function resolveReport(report, role, notes) {
  if (!canResolveReport(role)) {
    throw new Error("Only safety officers can resolve reports");
  }
  if (!notes || notes.trim() === "") {
    throw new Error("Resolution notes are required");
  }
  return { ...report, status: "Resolved", resolutionNotes: notes };
}
