import { supabaseServer } from "@/lib/supabase/server";

export type AppointmentRow = {
  id: string;
  title: string;
  doctor_name: string | null;
  hospital: string | null;
  appointment_at: string;
  notes: string | null;
  status: string;
};

const SELECT_FIELDS =
  "id, title, doctor_name, hospital, appointment_at, notes, status";

export async function getAppointmentsByBabyId(
  babyId: string
): Promise<AppointmentRow[]> {
  const { data, error } = await supabaseServer
    .from("appointments")
    .select(SELECT_FIELDS)
    .eq("baby_id", babyId)
    .order("appointment_at", { ascending: true });

  if (error) throw new Error(error.message ?? "Failed to load appointments");
  return (data ?? []) as AppointmentRow[];
}

export async function createAppointment(params: {
  baby_id: string;
  user_id: string;
  title: string;
  doctor_name?: string | null;
  hospital?: string | null;
  appointment_at: string;
  notes?: string | null;
  status?: string;
}): Promise<AppointmentRow | null> {
  const validStatuses = ["upcoming", "completed", "cancelled"];
  const status = params.status && validStatuses.includes(params.status)
    ? params.status
    : "upcoming";

  const { data, error } = await supabaseServer
    .from("appointments")
    // @ts-expect-error - insert type inference with generic Database
    .insert({
      baby_id: params.baby_id,
      user_id: params.user_id,
      title: params.title,
      doctor_name: params.doctor_name ?? null,
      hospital: params.hospital ?? null,
      appointment_at: params.appointment_at,
      notes: params.notes ?? null,
      status,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[appointmentRepository] createAppointment error:", error);
    return null;
  }
  return data as AppointmentRow;
}

export async function updateAppointment(
  id: string,
  params: {
    title: string;
    doctor_name?: string | null;
    hospital?: string | null;
    appointment_at: string;
    notes?: string | null;
    status?: string;
  }
): Promise<AppointmentRow | null> {
  const { data, error } = await supabaseServer
    .from("appointments")
    // @ts-expect-error - update type inference with generic Database
    .update({
      title: params.title,
      doctor_name: params.doctor_name ?? null,
      hospital: params.hospital ?? null,
      appointment_at: params.appointment_at,
      notes: params.notes ?? null,
      ...(params.status ? { status: params.status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[appointmentRepository] updateAppointment error:", error);
    return null;
  }
  return data as AppointmentRow;
}

export async function updateAppointmentStatus(
  id: string,
  status: string
): Promise<AppointmentRow | null> {
  const { data, error } = await supabaseServer
    .from("appointments")
    // @ts-expect-error - update type inference with generic Database
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[appointmentRepository] updateAppointmentStatus error:", error);
    return null;
  }
  return data as AppointmentRow;
}
