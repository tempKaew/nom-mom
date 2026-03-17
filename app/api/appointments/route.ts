import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import {
  getAppointmentsByBabyId,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
} from "@/repositories/appointmentRepository";
import { MESSAGES } from "@/constants/messages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const babyId = request.nextUrl.searchParams.get("babyId");
    if (!babyId) {
      return NextResponse.json(
        { error: MESSAGES.LOGS.BABY_ID_REQUIRED },
        { status: 400 }
      );
    }

    const isMember = await isMemberOfBaby(auth.userId, babyId);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const appointments = await getAppointmentsByBabyId(babyId);
    return NextResponse.json({ data: appointments });
  } catch (err) {
    console.error("[api/appointments] GET error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as {
      baby_id?: string;
      title?: string;
      doctor_name?: string | null;
      hospital?: string | null;
      appointment_at?: string;
      notes?: string | null;
      status?: string;
    };

    const { baby_id, title, appointment_at } = body;

    if (!baby_id) {
      return NextResponse.json(
        { error: MESSAGES.LOGS.BABY_ID_REQUIRED },
        { status: 400 }
      );
    }
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: MESSAGES.APPOINTMENTS.TITLE_REQUIRED },
        { status: 400 }
      );
    }
    if (!appointment_at) {
      return NextResponse.json(
        { error: MESSAGES.APPOINTMENTS.APPOINTMENT_AT_REQUIRED },
        { status: 400 }
      );
    }

    const isMember = await isMemberOfBaby(auth.userId, baby_id);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const appointment = await createAppointment({
      baby_id,
      user_id: auth.userId,
      title: title.trim(),
      doctor_name: body.doctor_name ?? null,
      hospital: body.hospital ?? null,
      appointment_at,
      notes: body.notes ?? null,
      status: body.status,
    });

    if (!appointment) {
      return NextResponse.json(
        { error: MESSAGES.APPOINTMENTS.ADD_FAILED },
        { status: 502 }
      );
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    console.error("[api/appointments] POST error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as {
      id?: string;
      baby_id?: string;
      title?: string;
      doctor_name?: string | null;
      hospital?: string | null;
      appointment_at?: string;
      notes?: string | null;
      status?: string;
    };

    const { id, baby_id, title, appointment_at } = body;

    if (!id || !baby_id) {
      return NextResponse.json({ error: "id and baby_id required" }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: MESSAGES.APPOINTMENTS.TITLE_REQUIRED },
        { status: 400 }
      );
    }
    if (!appointment_at) {
      return NextResponse.json(
        { error: MESSAGES.APPOINTMENTS.APPOINTMENT_AT_REQUIRED },
        { status: 400 }
      );
    }

    const isMember = await isMemberOfBaby(auth.userId, baby_id);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const updated = await updateAppointment(id, {
      title: title.trim(),
      doctor_name: body.doctor_name ?? null,
      hospital: body.hospital ?? null,
      appointment_at,
      notes: body.notes ?? null,
      status: body.status,
    });

    if (!updated) {
      return NextResponse.json(
        { error: MESSAGES.APPOINTMENTS.UPDATE_FAILED },
        { status: 502 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[api/appointments] PUT error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as {
      id?: string;
      baby_id?: string;
      status?: string;
    };

    const { id, baby_id, status } = body;

    if (!id || !baby_id || !status) {
      return NextResponse.json({ error: "id, baby_id, status required" }, { status: 400 });
    }

    const isMember = await isMemberOfBaby(auth.userId, baby_id);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const updated = await updateAppointmentStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: MESSAGES.APPOINTMENTS.UPDATE_FAILED },
        { status: 502 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[api/appointments] PATCH error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
