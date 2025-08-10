import { describe, it, expect } from 'vitest';
import { validateItineraryData } from '../src/itinerary';

describe('validateItineraryData', () => {
  it('should accept valid itinerary structure', async () => {
    const validItinerary = [
      {
        day: 1,
        theme: 'Historical Paris',
        activities: [
          { time: 'Morning', description: 'Visit the Louvre Museum', location: 'Louvre Museum' },
          { time: 'Afternoon', description: 'Explore Notre-Dame Cathedral', location: 'Île de la Cité' },
          { time: 'Evening', description: 'Dinner in the Latin Quarter', location: 'Latin Quarter' }
        ]
      },
      {
        day: 2,
        theme: 'Artistic Paris',
        activities: [
          { time: 'Morning', description: 'Visit Musée d\'Orsay', location: 'Musée d\'Orsay' },
          { time: 'Afternoon', description: 'Explore Montmartre', location: 'Montmartre' },
          { time: 'Evening', description: 'Moulin Rouge show', location: 'Moulin Rouge' }
        ]
      }
    ];
    
    const result = await validateItineraryData(validItinerary);
    expect(result).toBeNull();
  });

  it('should accept theme exactly 50 characters', async () => {
    const validTheme = 'a'.repeat(50);
    const validItinerary = [
      {
        day: 1,
        theme: validTheme,
        activities: [
          { time: 'Morning', description: 'Visit the Louvre', location: 'Louvre Museum' },
          { time: 'Afternoon', description: 'Explore Notre-Dame', location: 'Île de la Cité' },
          { time: 'Evening', description: 'Dinner in Latin Quarter', location: 'Latin Quarter' }
        ]
      }
    ];
    
    const result = await validateItineraryData(validItinerary);
    expect(result).toBeNull();
  });

  it('should accept description exactly 100 characters', async () => {
    const validDescription = 'a'.repeat(100);
    const validItinerary = [
      {
        day: 1,
        theme: 'Historical Paris',
        activities: [
          { time: 'Morning', description: validDescription, location: 'Louvre Museum' },
          { time: 'Afternoon', description: 'Explore Notre-Dame', location: 'Île de la Cité' },
          { time: 'Evening', description: 'Dinner in Latin Quarter', location: 'Latin Quarter' }
        ]
      }
    ];
    
    const result = await validateItineraryData(validItinerary);
    expect(result).toBeNull();
  });

  it('should accept location exactly 50 characters', async () => {
    const validLocation = 'a'.repeat(50);
    const validItinerary = [
      {
        day: 1,
        theme: 'Historical Paris',
        activities: [
          { time: 'Morning', description: 'Visit the Louvre', location: validLocation },
          { time: 'Afternoon', description: 'Explore Notre-Dame', location: 'Île de la Cité' },
          { time: 'Evening', description: 'Dinner in Latin Quarter', location: 'Latin Quarter' }
        ]
      }
    ];
    
    const result = await validateItineraryData(validItinerary);
    expect(result).toBeNull();
  });
});