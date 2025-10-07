/**
 * WhatsApp Business Integration for Albanian Market
 * Optimized for Albanian, Kosovo, and Macedonia users
 */

interface WhatsAppMessage {
  phone: string;
  message: string;
  listingUrl?: string;
  listingTitle?: string;
}

interface AlbanianCarrier {
  name: string;
  prefixes: string[];
  whatsappSupport: boolean;
}

class WhatsAppService {
  private static instance: WhatsAppService;

  // Albanian mobile carriers with WhatsApp support analysis
  private albanianCarriers: AlbanianCarrier[] = [
    {
      name: 'Vodafone Albania',
      prefixes: ['067', '068', '069'],
      whatsappSupport: true
    },
    {
      name: 'Telekom Albania',
      prefixes: ['066', '065'],
      whatsappSupport: true
    },
    {
      name: 'ONE Albania',
      prefixes: ['064'],
      whatsappSupport: true
    },
    {
      name: 'Plus Communication',
      prefixes: ['063'],
      whatsappSupport: true
    }
  ];

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Validate Albanian phone number and detect carrier
   */
  validateAlbanianPhone(phone: string): { isValid: boolean; carrier?: string; formatted?: string } {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Check if it's Albanian format
    let formattedPhone = '';

    if (cleanPhone.startsWith('355')) {
      // International format (+355)
      formattedPhone = '+' + cleanPhone;
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      // National format (067123456)
      formattedPhone = '+355' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 9) {
      // Without leading 0 (67123456)
      formattedPhone = '+355' + cleanPhone;
    } else {
      return { isValid: false };
    }

    // Detect carrier by prefix
    const prefix = formattedPhone.substring(4, 7); // Extract 3-digit prefix after +355
    const carrier = this.albanianCarriers.find(c => c.prefixes.includes(prefix));

    return {
      isValid: !!carrier,
      carrier: carrier?.name,
      formatted: formattedPhone
    };
  }

  /**
   * Generate Albanian message templates for different scenarios
   */
  getMessageTemplates() {
    return {
      interest: {
        subject: 'Interesim për makinën tuaj',
        template: (listingTitle: string, userName: string) =>
          `Përshëndetje! Jam i interesuar për makinën tuaj "${listingTitle}". A është ende e disponueshme? Faleminderit! - ${userName}`,
      },
      priceInquiry: {
        subject: 'Pyetje për çmimin',
        template: (listingTitle: string, userName: string) =>
          `Përshëndetje! A ka mundësi për negocim të çmimit për "${listingTitle}"? Faleminderit! - ${userName}`,
      },
      viewing: {
        subject: 'Kërkesë për shikim',
        template: (listingTitle: string, userName: string) =>
          `Përshëndetje! Mund të shohim makinën "${listingTitle}"? Kur jeni i lirë? Faleminderit! - ${userName}`,
      },
      financing: {
        subject: 'Pyetje për financim',
        template: (listingTitle: string, userName: string) =>
          `Përshëndetje! A keni mundësi financimi për "${listingTitle}"? Mund të diskutojmë kushtet? Faleminderit! - ${userName}`,
      },
      details: {
        subject: 'Pyetje për detaje',
        template: (listingTitle: string, userName: string) =>
          `Përshëndetje! Mund të më jepni më shumë detaje për "${listingTitle}"? Historia e makinës, dokumentet, etj.? Faleminderit! - ${userName}`,
      }
    };
  }

  /**
   * Generate WhatsApp URL for direct messaging
   */
  generateWhatsAppUrl(phone: string, message: string): string {
    const validation = this.validateAlbanianPhone(phone);
    if (!validation.isValid) {
      throw new Error('Invalid Albanian phone number');
    }

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = validation.formatted!.replace('+', '');

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Generate WhatsApp business message for listings
   */
  generateListingMessage(
    listingTitle: string,
    userName: string,
    messageType: keyof ReturnType<typeof this.getMessageTemplates> = 'interest'
  ): string {
    const templates = this.getMessageTemplates();
    const template = templates[messageType];

    return template.template(listingTitle, userName);
  }

  /**
   * Create WhatsApp share URL for listing
   */
  generateListingShareUrl(listing: any, baseUrl: string): string {
    const shareText = `🚗 ${listing.title}

💰 Çmimi: €${(listing.price / 100).toLocaleString()}
📅 Viti: ${listing.year}
⚙️ Kilometrazhi: ${listing.mileage.toLocaleString()} km
⛽ Karburant: ${this.translateFuelType(listing.fuelType)}
📍 Vendndodhja: ${listing.city}

Shiko më shumë detaje:
${baseUrl}/listings/${listing.id}

#AutoMarketShqiperia #MakinaPerShitje #${listing.city}`;

    return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  }

  /**
   * Translate fuel types to Albanian
   */
  private translateFuelType(fuelType: string): string {
    const translations: { [key: string]: string } = {
      'Petrol': 'Benzinë',
      'Diesel': 'Naftë',
      'Electric': 'Elektrike',
      'Hybrid': 'Hibride',
      'LPG': 'LPG'
    };
    return translations[fuelType] || fuelType;
  }

  /**
   * Get WhatsApp Business API configuration for automation
   */
  getBusinessConfig() {
    return {
      businessPhoneId: process.env.WHATSAPP_BUSINESS_PHONE_ID,
      accessToken: process.env.WHATSAPP_BUSINESS_ACCESS_TOKEN,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      apiUrl: 'https://graph.facebook.com/v17.0',
      supportedCountries: ['AL', 'XK', 'MK'], // Albania, Kosovo, Macedonia
      defaultLanguage: 'sq' // Albanian
    };
  }

  /**
   * Send automated WhatsApp message via Business API
   */
  async sendBusinessMessage(
    to: string,
    message: string,
    type: 'text' | 'template' = 'text'
  ): Promise<boolean> {
    try {
      const config = this.getBusinessConfig();

      if (!config.businessPhoneId || !config.accessToken) {
        console.log('WhatsApp Business API not configured, skipping automated message');
        return false;
      }

      // Validate Albanian phone number
      const validation = this.validateAlbanianPhone(to);
      if (!validation.isValid) {
        throw new Error(`Invalid phone number: ${to}`);
      }

      const response = await fetch(
        `${config.apiUrl}/${config.businessPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: validation.formatted!.replace('+', ''),
            type: type,
            text: type === 'text' ? { body: message } : undefined,
            template: type === 'template' ? {
              name: message, // Template name for template messages
              language: { code: 'sq' }
            } : undefined
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('WhatsApp Business API error:', result);
        return false;
      }

      console.log('WhatsApp message sent successfully:', result.messages?.[0]?.id);
      return true;

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Handle WhatsApp webhook for incoming messages
   */
  async handleWebhook(payload: any): Promise<any> {
    try {
      // Process incoming WhatsApp messages
      const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages || [];
      const contacts = payload.entry?.[0]?.changes?.[0]?.value?.contacts || [];

      for (const message of messages) {
        const phoneNumber = message.from;
        const messageText = message.text?.body || '';
        const messageType = message.type;

        console.log(`Received WhatsApp message from ${phoneNumber}: ${messageText}`);

        // Here you could implement auto-responses or route to customer service
        // For now, we'll just log the message
      }

      return { success: true, processed: messages.length };

    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const whatsappService = WhatsAppService.getInstance();

// Export utility functions
export const WhatsAppUtils = {
  generateContactUrl: (phone: string, message: string) =>
    whatsappService.generateWhatsAppUrl(phone, message),

  generateListingShareUrl: (listing: any, baseUrl: string) =>
    whatsappService.generateListingShareUrl(listing, baseUrl),

  validateAlbanianPhone: (phone: string) =>
    whatsappService.validateAlbanianPhone(phone),

  getMessageTemplates: () =>
    whatsappService.getMessageTemplates()
};