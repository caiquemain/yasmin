'use client';

export function openDemandaEditor(demandaId: string) {
  window.dispatchEvent(new CustomEvent('open-demanda-editor', { detail: { demandaId } }));
}
