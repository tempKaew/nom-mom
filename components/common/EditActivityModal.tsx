"use client";

/**
 * EditActivityModal — thin dispatcher.
 *
 * Each Add* modal already supports edit mode via its `initialData` prop.
 * This component simply routes to the correct modal so there is one source
 * of truth for every form: adding a field to a modal automatically works for
 * both create and edit.
 */

import type { Activity } from "@/config/activityConfig";
import { AddMilkLogModal } from "./AddMilkLogModal";
import { AddSleepLogModal } from "./AddSleepLogModal";
import { AddExcretionEventModal } from "./AddExcretionEventModal";
import { AddPumpingModal } from "./AddPumpingModal";

interface Props {
  activity: Activity;
  babyId: string;
  idToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditActivityModal({ activity, babyId, idToken, onClose, onSuccess }: Props) {
  const { source } = activity;

  switch (source.kind) {
    case "milk":
      return (
        <AddMilkLogModal
          idToken={idToken} babyId={babyId}
          initialData={source.data}
          onClose={onClose} onSuccess={onSuccess}
        />
      );
    case "sleep":
      return (
        <AddSleepLogModal
          idToken={idToken} babyId={babyId}
          initialData={source.data}
          onClose={onClose} onSuccess={onSuccess}
        />
      );
    case "excretion":
      return (
        <AddExcretionEventModal
          idToken={idToken} babyId={babyId}
          initialData={source.data}
          onClose={onClose} onSuccess={onSuccess}
        />
      );
    case "pumping":
      return (
        <AddPumpingModal
          idToken={idToken} babyId={babyId}
          initialData={source.data}
          onClose={onClose} onSuccess={onSuccess}
        />
      );
    default:
      return null;
  }
}
