import { z } from 'zod';

const ActivitySchema = z.object({
  time: z.enum(['Morning', 'Afternoon', 'Evening']),
  description: z.string().max(100),
  location: z.string().max(50),
});

const ItineraryDaySchema = z.object({
  day: z.number().int().positive(),
  theme: z.string().max(50),
  activities: z.array(ActivitySchema).length(3),
});

export const ItinerarySchema = z.array(ItineraryDaySchema);