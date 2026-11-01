import { and, count, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { z } from 'zod';
import * as schema from '../db/schema';
import type { decisionInput, reservationListInput } from './validation';
import { isFutureSlot } from './timezone';

type Database = NodePgDatabase<typeof schema>;
const { reservations, venues, reservationEvents } = schema;
export class ReservationConflict extends Error {}

export async function listReservations(database: Database, input: z.infer<typeof reservationListInput>) {
  return database.transaction(async tx => {
    const groups = await tx.select({ status: reservations.status, n: count() })
      .from(reservations).groupBy(reservations.status);
    const counts = { pending: 0, approved: 0, rejected: 0, all: 0 };
    for (const group of groups) {
      if (group.status === 'pending' || group.status === 'approved' || group.status === 'rejected') {
        counts[group.status] = Number(group.n);
        counts.all += Number(group.n);
      }
    }
    const total = counts[input.status];
    const pageCount = Math.max(1, Math.ceil(total / input.pageSize));
    const page = Math.min(input.page, pageCount);
    const data = await tx.select({ id: reservations.id, venueName: venues.name,
      bookingDate: reservations.bookingDate, startsAt: reservations.startsAt, endsAt: reservations.endsAt,
      applicantName: reservations.applicantName, applicantEmail: reservations.applicantEmail,
      purpose: reservations.purpose, attendees: reservations.attendees, status: reservations.status,
      decisionNote: reservations.decisionNote, createdAt: reservations.createdAt })
      .from(reservations).innerJoin(venues, eq(reservations.venueId, venues.id))
      .where(input.status === 'all' ? undefined : eq(reservations.status, input.status))
      .orderBy(desc(reservations.createdAt), desc(reservations.id))
      .limit(input.pageSize).offset((page - 1) * input.pageSize);
    return { data, counts, pagination: { page, pageSize: input.pageSize, total, pageCount } };
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' });
}

export async function decideReservation(database: Database, id: string, adminId: string,
  decision: z.infer<typeof decisionInput>) {
  return database.transaction(async tx => {
    // Lock both records so concurrent decisions and venue edits cannot invalidate the checks.
    const [booking] = await tx.select({ status: reservations.status, bookingDate: reservations.bookingDate,
      startsAt: reservations.startsAt, attendees: reservations.attendees,
      enabled: venues.enabled, capacity: venues.capacity })
      .from(reservations).innerJoin(venues, eq(reservations.venueId, venues.id))
      .where(eq(reservations.id, id)).for('update');
    if (!booking || booking.status !== 'pending') {
      throw new ReservationConflict('Booking already processed or not found');
    }
    if (decision.status === 'approved') {
      if (!isFutureSlot(booking.bookingDate, booking.startsAt)) {
        throw new ReservationConflict('This booking has already started; reject it instead');
      }
      if (!booking.enabled) throw new ReservationConflict('This venue is paused; enable it before approval');
      if (booking.attendees > booking.capacity) {
        throw new ReservationConflict('Attendee count exceeds the current venue capacity');
      }
    }
    const [row] = await tx.update(reservations).set({ status: decision.status,
      decisionNote: decision.decisionNote, decidedBy: adminId, decidedAt: new Date() })
      .where(and(eq(reservations.id, id), eq(reservations.status, 'pending')))
      .returning({ id: reservations.id, status: reservations.status });
    if (!row) throw new ReservationConflict('Booking already processed');
    await tx.insert(reservationEvents).values({ reservationId: id, action: row.status, actorId: adminId });
    return row;
  });
}
