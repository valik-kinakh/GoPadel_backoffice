/* eslint-disable @typescript-eslint/consistent-type-imports */

/**
 * Use the ukrainian messages file as the default type for all messages.
 *
 * As described within the `next-intl` docs, we declare a type globally
 * and base it on the const import of the ukrainian `{{locale}}.json`.
 */
type Messages = typeof import("./messages/ua.json");
type IntlMessages = Messages;
