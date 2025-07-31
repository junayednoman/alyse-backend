export const generateTransactionId = (prefix = 'txn') => {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const random = Math.random().toString(36).substring(2, 10); // Random string
  return `${prefix}_${timestamp}_${random}`; // Combine with prefix
};
