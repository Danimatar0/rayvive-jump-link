// Application Configuration Constants

export const WHATSAPP_CONFIG = {
  number: "96181807324",
  baseUrl: "https://wa.me",
} as const;

// Helper function to create WhatsApp links
export const createWhatsAppLink = (message: string): string => {
  return `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.number}?text=${encodeURIComponent(message)}`;
};
