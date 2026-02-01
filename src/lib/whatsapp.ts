/**
 * WhatsApp Integration Helper
 * Centralizes WhatsApp redirection logic and manages contact information
 */

export interface WhatsAppConfig {
  number: string;
  message: string;
}

/**
 * Creates a WhatsApp URL with the specified number and message
 * @param config - WhatsApp configuration object
 * @returns The complete WhatsApp URL
 */
export function createWhatsAppUrl(config: WhatsAppConfig): string {
  const { number, message } = config;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Opens WhatsApp in a new tab/window with the specified message
 * @param message - The message to send
 * @param number - Optional phone number (defaults to environment variable)
 */
export function openWhatsApp(message: string, number?: string): void {
  const whatsappNumber = number || import.meta.env.VITE_WHATSAPP_NUMBER;

  if (!whatsappNumber) {
    console.error('WhatsApp number not configured. Please set VITE_WHATSAPP_NUMBER in your environment.');
    return;
  }

  const url = createWhatsAppUrl({
    number: whatsappNumber,
    message
  });

  window.open(url, '_blank');
}

/**
 * Predefined message templates for common use cases
 */
export const WhatsAppMessages = {
  general: "Hi! I have a question about Rayvive jump ropes. Can you help me?",
  heroTransformation: "Hi! I'd like to start my fitness transformation with Rayvive jump ropes. Can you help me choose the right rope?",
  recommendations: "Hi! I'd like to get personalized recommendations for choosing the right Rayvive jump rope based on my fitness goals.",
  customOrder: (color: string, length: string, handle: string, price: string) =>
    `Hi! I'd like to order a custom Rayvive jump rope:

Color: ${color}
Length: ${length}
Handle: ${handle}
Total Price: ${price}

Please let me know the next steps!`,
  productPurchase: (productName: string, price: string) =>
    `Hi! I'd like to finalize my purchase of the ${productName} jump rope (${price}).

Please let me know the next steps for ordering!`
} as const;