import { ItinerarySchema } from './validation';
import axios from 'axios';
import { retry } from 'ts-retry-promise';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { Env } from './types';


export async function validateItineraryData(data: any): Promise<string | null> {
  const validationResult = ItinerarySchema.safeParse(data);
  if (!validationResult.success) {
    return validationResult.error.message;
  }
  return null;
}

export async function processItinerary(
  jobId: string,
  destination: string,
  durationDays: number,
  db: any,
  env: Env,
  template: string
) {
  console.log(`Starting itinerary processing for jobId: ${jobId}`);
  try {
    const response = await retry(
      () =>
        axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              {
                role: 'user',
                content: template.replace('{destination}', destination).replace('{durationDays}', durationDays.toString()),
              },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.LLM_API_KEY}`,
            },
            timeout: 30000, // 30-second timeout
          }
        ),
      { retries: 3, delay: 1000, backoff: 'exponential' } 
    );
    
    let itineraryData;
    try {
      itineraryData = JSON.parse(response.data.choices[0].message.content);
    } catch (parseError) {
      throw new Error('Failed to parse JSON response from LLM');
    }
    
    const validationError = await validateItineraryData(itineraryData);
    if (validationError) {
      throw new Error(`Invalid itinerary format: ${validationError}`);
    }
    
    await setDoc(
      doc(collection(db, 'itineraries'), jobId),
      {
        status: 'completed',
        itinerary: itineraryData,
        completedAt: Timestamp.now(),
        error: null,
      },
      { merge: true }
    );
    console.log(`Firestore updated to completed for jobId: ${jobId}`);
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to generate itinerary';
    console.error(`Error processing itinerary for jobId: ${jobId}`, errorMessage);
    await setDoc(
      doc(collection(db, 'itineraries'), jobId),
      {
        status: 'failed',
        completedAt: Timestamp.now(),
        error: errorMessage,
      },
      { merge: true }
    );
    console.error(`Firestore updated to failed for jobId: ${jobId}`);
  }
}