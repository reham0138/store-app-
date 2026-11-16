/**
 * Short display id for orders: "#" + last 8 chars of the Mongo id,
 * uppercase. The full id is always available via the `title` tooltip.
 */
export function shortOrderId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}
