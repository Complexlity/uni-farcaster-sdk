export function isAddress(address: string): boolean  {
  return /^(0x){1}[0-9a-fA-F]{40}$/i.test(address);
}
