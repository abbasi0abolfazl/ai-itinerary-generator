import { describe, it, expect } from 'vitest';
import { validateInput } from '../src/index';

describe('validateInput', () => {
  it('should return null for valid input', async () => {
    const result = await validateInput('Paris, France', 5);
    expect(result).toBeNull();
  });

  it('should reject empty destination', async () => {
    const result = await validateInput('', 5);
    expect(result).toBe('Destination must be a non-empty string (max 100 characters)');
  });

  it('should reject whitespace-only destination', async () => {
    const result = await validateInput('   ', 5);
    expect(result).toBe('Destination must be a non-empty string (max 100 characters)');
  });

  it('should reject destination longer than 100 characters', async () => {
    const longDestination = 'a'.repeat(101);
    const result = await validateInput(longDestination, 5);
    expect(result).toBe('Destination must be a non-empty string (max 100 characters)');
  });

  it('should accept destination exactly 100 characters', async () => {
    const validDestination = 'a'.repeat(100);
    const result = await validateInput(validDestination, 5);
    expect(result).toBeNull();
  });

  it('should reject duration less than 1', async () => {
    const result = await validateInput('Paris, France', 0);
    expect(result).toBe('DurationDays must be an integer between 1 and 30');
  });

  it('should reject duration greater than 30', async () => {
    const result = await validateInput('Paris, France', 31);
    expect(result).toBe('DurationDays must be an integer between 1 and 30');
  });

  it('should reject non-integer duration', async () => {
    const result = await validateInput('Paris, France', 3.5);
    expect(result).toBe('DurationDays must be an integer between 1 and 30');
  });

  it('should accept minimum valid duration (1)', async () => {
    const result = await validateInput('Paris, France', 1);
    expect(result).toBeNull();
  });

  it('should accept maximum valid duration (30)', async () => {
    const result = await validateInput('Paris, France', 30);
    expect(result).toBeNull();
  });

  it('should reject non-string destination', async () => {
    // @ts-expect-error Testing invalid input type
    const result = await validateInput(123, 5);
    expect(result).toBe('Destination must be a non-empty string (max 100 characters)');
  });

  it('should reject non-number duration', async () => {
    // @ts-expect-error Testing invalid input type
    const result = await validateInput('Paris, France', '5');
    expect(result).toBe('DurationDays must be an integer between 1 and 30');
  });
});