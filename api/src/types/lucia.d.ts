/**
 * Lucia module augmentation — adds custom user attributes.
 */
import "lucia";
import { Lucia } from "lucia";

declare module "lucia" {
  interface Register {
    Lucia: Lucia<
      Record<never, never>,
      { email: string; name: string; plan: string; role: string }
    >;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      plan: string;
      role: string;
    };
  }
}