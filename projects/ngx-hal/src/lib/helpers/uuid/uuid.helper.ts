export function generateUUID() {
  return `${Math.floor(Math.random() * 1e10)}-${Date.now()}`;
}
