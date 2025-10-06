// Base AI Service with provider abstraction for Albanian Automotive Marketplace

import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';
import { aiConfig, type AIConfig } from './config';

export interface AIProvider {
  name: string;
  generateText(prompt: string, options?: any): Promise<string>;
  analyzeText(text: string, options?: any): Promise<any>;
  embedText(text: string): Promise<number[]>;
}

export class OpenAIProvider implements AIProvider {
  public name = 'openai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || aiConfig.apiKeys.openai || process.env.OPENAI_API_KEY,
    });
  }

  async generateText(prompt: string, options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}): Promise<string> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4-turbo-preview',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  async analyzeText(text: string, options: {
    task?: 'sentiment' | 'classification' | 'fraud_detection';
    categories?: string[];
  } = {}): Promise<any> {
    const prompt = this.buildAnalysisPrompt(text, options);
    const response = await this.generateText(prompt, {
      temperature: 0.1,
      maxTokens: 500,
    });

    try {
      return JSON.parse(response);
    } catch {
      return { analysis: response };
    }
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw new Error(`OpenAI embedding failed: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(text: string, options: any): string {
    switch (options.task) {
      case 'sentiment':
        return `Analizoni sentimentin e këtij teksti në shqip dhe ktheni rezultatin në JSON:
        Teksti: "${text}"

        Ktheni në formatin: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0, "explanation": "shpjegim në shqip"}`;

      case 'fraud_detection':
        return `Analizoni këtë listim automjeti për shenja të mundshme mashtrimi. Ktheni rezultatin në JSON:
        Teksti: "${text}"

        Kontrolloni për:
        - Çmime të pazakonta të ulëta ose të larta
        - Informacione kontradiktore
        - Gjuhë të dyshimtë
        - Mungesë detajesh të rëndësishme

        Ktheni në formatin: {"fraud_risk": 0.0-1.0, "flags": ["flag1", "flag2"], "explanation": "shpjegim në shqip"}`;

      default:
        return `Analizoni këtë tekst dhe ktheni rezultatin në JSON: "${text}"`;
    }
  }
}

export class HuggingFaceProvider implements AIProvider {
  public name = 'huggingface';
  private client: HfInference;

  constructor(apiKey?: string) {
    this.client = new HfInference(apiKey || aiConfig.apiKeys.huggingface || process.env.HUGGINGFACE_API_KEY);
  }

  async generateText(prompt: string, options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}): Promise<string> {
    try {
      const response = await this.client.textGeneration({
        model: options.model || 'microsoft/DialoGPT-medium',
        inputs: prompt,
        parameters: {
          temperature: options.temperature || 0.7,
          max_new_tokens: options.maxTokens || 1000,
          return_full_text: false,
        },
      });

      return response.generated_text;
    } catch (error) {
      console.error('HuggingFace API error:', error);
      throw new Error(`HuggingFace generation failed: ${error.message}`);
    }
  }

  async analyzeText(text: string, options: any = {}): Promise<any> {
    try {
      const response = await this.client.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: text,
      });

      return response;
    } catch (error) {
      console.error('HuggingFace analysis error:', error);
      throw new Error(`HuggingFace analysis failed: ${error.message}`);
    }
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.client.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text,
      });

      // HuggingFace returns different formats, normalize to array
      if (Array.isArray(response) && Array.isArray(response[0])) {
        return response[0];
      }
      return response as number[];
    } catch (error) {
      console.error('HuggingFace embedding error:', error);
      throw new Error(`HuggingFace embedding failed: ${error.message}`);
    }
  }
}

export class LocalProvider implements AIProvider {
  public name = 'local';

  async generateText(prompt: string, options: any = {}): Promise<string> {
    // Implement local text generation (simple rule-based for now)
    return this.simpleGeneration(prompt);
  }

  async analyzeText(text: string, options: any = {}): Promise<any> {
    // Implement local text analysis
    return {
      length: text.length,
      words: text.split(' ').length,
      sentiment: 'neutral',
      confidence: 0.5,
    };
  }

  async embedText(text: string): Promise<number[]> {
    // Simple local embedding (TF-IDF like)
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(100).fill(0);

    words.forEach((word, index) => {
      const hash = this.simpleHash(word) % 100;
      vector[hash] += 1;
    });

    return vector;
  }

  private simpleGeneration(prompt: string): string {
    // Very basic text generation for fallback
    if (prompt.includes('çmim') || prompt.includes('price')) {
      return 'Çmimi duket të jetë në përputhje me tregun.';
    }
    if (prompt.includes('përshkrim') || prompt.includes('description')) {
      return 'Ky automjet duket interesant dhe në gjendje të mirë.';
    }
    return 'Faleminderit për pyetjen tuaj.';
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export class AIProviderFactory {
  private static providers = new Map<string, AIProvider>();

  static getProvider(type: 'openai' | 'huggingface' | 'local'): AIProvider {
    if (!this.providers.has(type)) {
      switch (type) {
        case 'openai':
          this.providers.set(type, new OpenAIProvider());
          break;
        case 'huggingface':
          this.providers.set(type, new HuggingFaceProvider());
          break;
        case 'local':
          this.providers.set(type, new LocalProvider());
          break;
        default:
          throw new Error(`Unknown provider type: ${type}`);
      }
    }

    return this.providers.get(type)!;
  }

  static async testProvider(type: 'openai' | 'huggingface' | 'local'): Promise<boolean> {
    try {
      const provider = this.getProvider(type);
      await provider.generateText('Test', { maxTokens: 10 });
      return true;
    } catch (error) {
      console.error(`Provider ${type} test failed:`, error);
      return false;
    }
  }
}

export default AIProviderFactory;