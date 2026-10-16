export const PLATFORM_FEE_PERCENT = 25;

export function calculatePlatformFee(subtotalCents: number) {
  return Math.round(subtotalCents * PLATFORM_FEE_PERCENT / 100);
}
