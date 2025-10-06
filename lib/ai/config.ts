// AI Service Configuration for Albanian Automotive Marketplace

export interface AIConfig {
  // Model configurations
  models: {
    pricing: {
      provider: 'openai' | 'huggingface' | 'local';
      model: string;
      temperature: number;
      maxTokens: number;
    };
    content: {
      provider: 'openai' | 'huggingface' | 'local';
      model: string;
      temperature: number;
      maxTokens: number;
    };
    fraud: {
      provider: 'openai' | 'huggingface' | 'local';
      model: string;
      threshold: number;
    };
    recommendations: {
      provider: 'openai' | 'huggingface' | 'local';
      model: string;
      similarityThreshold: number;
    };
    chatbot: {
      provider: 'openai' | 'huggingface' | 'local';
      model: string;
      temperature: number;
      maxTokens: number;
      systemPrompt: string;
    };
  };

  // Albanian market specific settings
  albanianMarket: {
    regions: string[];
    seasonalFactors: Record<string, number>;
    popularMakes: string[];
    currencyRate: number; // EUR to ALL conversion
  };

  // Processing settings
  processing: {
    batchSize: number;
    retryAttempts: number;
    timeout: number;
    queuePriorities: Record<string, number>;
  };

  // API Keys and endpoints
  apiKeys: {
    openai?: string;
    huggingface?: string;
  };
}

export const aiConfig: AIConfig = {
  models: {
    pricing: {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.3,
      maxTokens: 500,
    },
    content: {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 1000,
    },
    fraud: {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      threshold: 0.7,
    },
    recommendations: {
      provider: 'local',
      model: 'similarity-based',
      similarityThreshold: 0.6,
    },
    chatbot: {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.6,
      maxTokens: 800,
      systemPrompt: `Ju jeni një asistent i zgjuar për tregun shqiptar të automjeteve. Ju flisni shqip dhe jeni ekspert në blerjen dhe shitjen e makinave në Shqipëri. Ju keni njohuri të thella për:

- Çmimet e automjeteve në Shqipëri
- Procedurat e regjistrimit dhe transferimit
- Dokumentet e nevojshme
- Vlerësimin e gjendjes së automjeteve
- Negocimin e çmimeve
- Praktikat e sigurta të blerjeve

Ju duhet të jeni i dobishëm, i saktë dhe të flisni në mënyrë miqësore. Përdorni terma të saktë teknikë në shqip dhe ofroni këshilla praktike. Nëse nuk dini diçka, thoni që nuk e dini dhe sugjeroni kontaktimin e një eksperti.`,
    },
  },

  albanianMarket: {
    regions: [
      'Tiranë',
      'Durrës',
      'Vlorë',
      'Shkodër',
      'Korçë',
      'Elbasan',
      'Fier',
      'Berat',
      'Gjirokastër',
      'Kukës',
      'Lezhë',
      'Dibër'
    ],
    seasonalFactors: {
      'spring': 1.1,   // Higher demand in spring
      'summer': 1.2,   // Peak demand in summer
      'autumn': 0.9,   // Lower demand in autumn
      'winter': 0.8,   // Lowest demand in winter
    },
    popularMakes: [
      'Mercedes-Benz',
      'BMW',
      'Audi',
      'Volkswagen',
      'Toyota',
      'Opel',
      'Ford',
      'Peugeot',
      'Renault',
      'Fiat',
      'Hyundai',
      'Kia'
    ],
    currencyRate: 100, // 1 EUR = 100 ALL (approximate)
  },

  processing: {
    batchSize: 50,
    retryAttempts: 3,
    timeout: 30000, // 30 seconds
    queuePriorities: {
      fraud_detection: 1,
      pricing_analysis: 2,
      content_generation: 3,
      recommendations: 4,
      chatbot: 5,
    },
  },

  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
  },
};

// Albanian language specific configurations
export const albanianLanguageConfig = {
  stopWords: [
    'dhe', 'ose', 'por', 'në', 'me', 'nga', 'për', 'të', 'i', 'e', 'që', 'si', 'një', 'kjo', 'kjo', 'ai', 'ajo'
  ],

  carTerms: {
    makes: {
      'Mercedes-Benz': ['mercedesbenz', 'mercedes', 'benz'],
      'BMW': ['bmw', 'bavarian'],
      'Volkswagen': ['volkswagen', 'vw', 'golf', 'passat'],
      'Toyota': ['toyota', 'corolla', 'prius'],
      // Add more Albanian-specific car term mappings
    },

    bodyTypes: {
      'sedan': ['sedan', 'limuzinë'],
      'hatchback': ['hatchback', 'kompakt'],
      'suv': ['suv', 'jeep', 'terren'],
      'kombi': ['kombi', 'station wagon'],
      'coupe': ['coupe', 'sportive'],
      'cabriolet': ['cabriolet', 'kabriolet', 'me çati'],
    },

    fuelTypes: {
      'benzine': ['benzinë', 'benzine', 'petrol'],
      'diesel': ['diesel', 'nafte'],
      'hybrid': ['hibrid', 'hybrid'],
      'electric': ['elektrik', 'electric'],
      'lpg': ['lpg', 'gaz'],
    },

    transmissions: {
      'manual': ['manual', 'dorë'],
      'automatic': ['automatik', 'automatic'],
    },
  },

  priceTerms: {
    currencies: ['eur', 'euro', 'lek', 'lekë', 'dollar', 'usd'],
    ranges: ['nga', 'deri', 'midis', 'rreth', 'circa', 'ca'],
  },
};

export default aiConfig;