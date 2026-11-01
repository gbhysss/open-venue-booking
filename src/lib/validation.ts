import { z } from 'zod';
const venueFields = {
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000),
  location: z.string().trim().max(160),
  capacity: z.number().int().min(1).max(20000),
  enabled: z.boolean(),
};
export const venueInput = z.object({ ...venueFields,
  description: venueFields.description.default(''),
  location: venueFields.location.default(''),
  enabled: venueFields.enabled.default(true),
});
// PATCH must never inherit creation defaults or invent missing changes.
export const venuePatchInput = z.object(venueFields).partial().strict()
  .refine(value => Object.values(value).some(x => x !== undefined), 'Provide at least one field');
export const reservationListInput = z.object({
  status: z.enum(['all','pending','approved','rejected']).default('all'),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export const reservationInput = z.object({
  venueId: z.string().uuid(),
  bookingDate: z.iso.date(),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  applicantName: z.string().trim().min(2).max(80),
  applicantEmail: z.email().max(180),
  purpose: z.string().trim().min(3).max(500),
  attendees: z.number().int().min(1).max(20000),
  website: z.string().max(0).optional(), // Honeypot for unsophisticated bots; not a substitute for rate limits.
}).refine(x=>x.endsAt > x.startsAt, { path:['endsAt'], message:'End time must be later than start time' });
export const decisionInput = z.object({ status:z.enum(['approved','rejected']), decisionNote:z.string().trim().max(500).optional().default('') });
export { todayInZone, isFutureSlot } from './timezone';
