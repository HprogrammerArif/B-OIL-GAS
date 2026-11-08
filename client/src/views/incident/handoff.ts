/** A machine chosen on Assets, carried into the safety report that opens next. */
export interface IncidentDraft {
  equipment: string;
  place: string;
}

let pending: IncidentDraft | null = null;

export function queueIncidentDraft(draft: IncidentDraft) {
  pending = draft;
}

export function peekIncidentDraft(): IncidentDraft | null {
  return pending;
}

export function clearIncidentDraft() {
  pending = null;
}

export function incidentDraftPlace(draft: IncidentDraft): string {
  return draft.place ? `${draft.equipment} — ${draft.place}` : draft.equipment;
}
