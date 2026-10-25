import { registerDecorator, ValidationOptions } from 'class-validator';
import { visibleTextLength } from '@riff/html-sanitize';

/**
 * Validates that a string has at most `max` visible characters. HTML markup,
 * attributes and non-text content (script/style) do not count.
 */
export function MaxVisibleTextLength(
  max: number,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'maxVisibleTextLength',
      target: object.constructor,
      propertyName: String(propertyName),
      constraints: [max],
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value !== 'string' || visibleTextLength(value) <= max;
        },
        defaultMessage(args): string {
          const limit = args?.constraints?.[0] ?? max;
          return `${args?.property ?? String(propertyName)} must have at most ${limit} visible characters`;
        },
      },
    });
  };
}
