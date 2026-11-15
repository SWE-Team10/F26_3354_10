import { describe, it, expect } from "vitest";
import { resolveReport, canResolveReport } from "./permissions";

const openReport = { id: 1, status: "Open", severity: "High" };

describe("resolveReport (FR-7)", () => {
  it("TC-1: safety officer with notes resolves an open report", () => {
    const result = resolveReport(openReport, "Safety Officer", "Fenced off area");
    expect(result.status).toBe("Resolved");
    expect(result.resolutionNotes).toBe("Fenced off area");
  });

  it("TC-2: supervisor cannot resolve a report", () => {
    expect(() => resolveReport(openReport, "Supervisor", "notes")).toThrow();
    expect(canResolveReport("Worker")).toBe(false);
  });

  it("TC-3: empty notes are rejected", () => {
    expect(() => resolveReport(openReport, "Safety Officer", "  ")).toThrow();
  });
});
