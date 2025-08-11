import { z } from 'zod';

const emailSchema = z.string().email();

/**
 * Email value object
 * - Validates format at creation
 * - Immutable and comparable
 */
export class Email {
  private constructor(private readonly value: string) {}

  public static create(input: string): Email {
    const parsed: string = emailSchema.parse(input);
    return new Email(parsed);
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public get primitive(): string {
    return this.value;
  }
}
