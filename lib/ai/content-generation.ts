// Auto-Generated Content System for Albanian Automotive Marketplace

import { AIProviderFactory } from './base';
import { aiConfig, albanianLanguageConfig } from './config';
import { prisma } from '@/lib/prisma';

export interface ContentGenerationRequest {
  type: 'listing_description' | 'seo_title' | 'social_post' | 'email_template' | 'ad_copy';
  language: 'sq' | 'en';
  context: {
    listing?: any;
    user?: any;
    targetAudience?: string;
    tone?: 'professional' | 'casual' | 'urgent' | 'luxury';
    length?: 'short' | 'medium' | 'long';
    keywords?: string[];
  };
  originalContent?: string;
}

export interface GeneratedContent {
  content: string;
  title?: string;
  metadata: {
    language: string;
    wordCount: number;
    readabilityScore: number;
    seoScore: number;
    keywords: string[];
    tone: string;
  };
  alternatives: string[];
  suggestions: string[];
  confidence: number;
}

export class ContentGenerationService {
  private provider = AIProviderFactory.getProvider(aiConfig.models.content.provider);

  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      const { type, language, context } = request;

      let generatedContent: GeneratedContent;

      switch (type) {
        case 'listing_description':
          generatedContent = await this.generateListingDescription(context, language);
          break;
        case 'seo_title':
          generatedContent = await this.generateSEOTitle(context, language);
          break;
        case 'social_post':
          generatedContent = await this.generateSocialPost(context, language);
          break;
        case 'email_template':
          generatedContent = await this.generateEmailTemplate(context, language);
          break;
        case 'ad_copy':
          generatedContent = await this.generateAdCopy(context, language);
          break;
        default:
          throw new Error(`Unknown content type: ${type}`);
      }

      // Apply Albanian market optimization
      generatedContent = await this.optimizeForAlbanianMarket(generatedContent, context);

      // Save generated content for learning
      await this.saveGeneratedContent(request, generatedContent);

      return generatedContent;
    } catch (error) {
      console.error('Content generation failed:', error);
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateListingDescription(context: any, language: string): Promise<GeneratedContent> {
    const { listing, tone = 'professional', length = 'medium' } = context;

    const prompt = this.buildListingDescriptionPrompt(listing, tone, length, language);

    const aiResponse = await this.provider.generateText(prompt, {
      model: aiConfig.models.content.model,
      temperature: aiConfig.models.content.temperature,
      maxTokens: this.getMaxTokensForLength(length),
    });

    // Parse AI response and extract alternatives
    const { content, alternatives } = this.parseContentResponse(aiResponse);

    // Calculate metadata
    const metadata = {
      language,
      wordCount: content.split(/\s+/).length,
      readabilityScore: this.calculateReadabilityScore(content, language),
      seoScore: this.calculateSEOScore(content, listing),
      keywords: this.extractKeywords(content, language),
      tone,
    };

    // Generate suggestions for improvement
    const suggestions = this.generateContentSuggestions(content, metadata, listing);

    return {
      content,
      metadata,
      alternatives: alternatives || [],
      suggestions,
      confidence: 0.85,
    };
  }

  private buildListingDescriptionPrompt(listing: any, tone: string, length: string, language: string): string {
    const isAlbanian = language === 'sq';

    const toneDescriptions: Record<string, string> = {
      professional: 'profesional',
      casual: 'miqësor',
      urgent: 'urgjent',
      luxury: 'luksoz'
    };

    const lengthGuides: Record<string, string> = {
      short: 'maksimumi 100 fjalë',
      medium: 'rreth 200 fjalë',
      long: 'rreth 400 fjalë'
    };

    if (isAlbanian) {
      return `Krijoni një përshkrim ${toneDescriptions[tone]} në shqip për këtë automjet në tregun shqiptar. Përshkrimi duhet të jetë ${lengthGuides[length]}.
DETAJET E AUTOMJETIT:
- Marka: ${listing.make}
- Modeli: ${listing.model}
- Viti: ${listing.year}
- Kilometrazhi: ${listing.mileage?.toLocaleString()} km
- Karburanti: ${listing.fuelType}
- Transmisioni: ${listing.transmission}
- Tipi: ${listing.bodyType}
- Ngjyra: ${listing.color || 'N/A'}
- Vendndodhja: ${listing.city}${listing.region ? `, ${listing.region}` : ''}
- Çmimi: ${(listing.price / 100).toLocaleString()} EUR

${listing.description ? `PËRSHKRIMI AKTUAL: "${listing.description}"` : ''}

KËRKESAT:
1. Filloni me një titull tërheqës
2. Theksoni veçoritë kryesore
3. Përmenndni gjendjen e automjetit
4. Shtoni detaje për sigurinë dhe komfortin
5. Përfundoni me një thirrje për veprim
6. Përdorni terma të duhura teknike në shqip
7. Mos premtoni gjëra që nuk mund të verifikohen
8. Jini specifik dhe i saktë

STILI:
- Ton: ${toneDescriptions[tone]}
- Gjatësia: ${lengthGuides[length]}
- Gjuhë: Shqip standard, e qartë dhe profesionale
- Publiku: Blerës automjetesh në Shqipëri

Ju lutemi ktheni 3 variante të ndryshme të përshkrimit në formatin:

VERSIONI 1:
[përshkrimi këtu]

VERSIONI 2:
[përshkrimi këtu]

VERSIONI 3:
[përshkrimi këtu]`;
    } else {
      return `Create a ${toneDescriptions[tone]} car listing description in English for the Albanian automotive market. The description should be ${lengthGuides[length]}.

VEHICLE DETAILS:
- Make: ${listing.make}
- Model: ${listing.model}
- Year: ${listing.year}
- Mileage: ${listing.mileage?.toLocaleString()} km
- Fuel Type: ${listing.fuelType}
- Transmission: ${listing.transmission}
- Body Type: ${listing.bodyType}
- Color: ${listing.color || 'N/A'}
- Location: ${listing.city}${listing.region ? `, ${listing.region}` : ''}
- Price: ${(listing.price / 100).toLocaleString()} EUR

${listing.description ? `CURRENT DESCRIPTION: "${listing.description}"` : ''}

REQUIREMENTS:
1. Start with an engaging headline
2. Highlight key features
3. Mention vehicle condition
4. Add safety and comfort details
5. End with call to action
6. Use proper automotive terminology
7. Don't make unverifiable claims
8. Be specific and accurate

STYLE:
- Tone: ${toneDescriptions[tone]}
- Length: ${lengthGuides[length]}
- Language: Clear, professional English
- Audience: Car buyers in Albania

Please return 3 different versions in the format:

VERSION 1:
[description here]

VERSION 2:
[description here]

VERSION 3:
[description here]`;
    }
  }

  private async generateSEOTitle(context: any, language: string): Promise<GeneratedContent> {
    const { listing, keywords = [] } = context;
    const isAlbanian = language === 'sq';

    const prompt = isAlbanian ?
      `Krijoni tituj SEO të optimizuar në shqip për këtë listim automjeti:

${listing.make} ${listing.model} ${listing.year}, ${listing.mileage} km, ${(listing.price / 100).toLocaleString()} EUR
Vendndodhja: ${listing.city}

Fjalët kyçe për të përfshirë: ${keywords.join(', ')}

Kërkesat:
- Maksimumi 60 karaktere
- Përfshini markën, modelin, vitin
- Shtoni çmimin ose vendndodhjen
- Përdorni fjalë kyçe që kërkohen në Shqipëri
- Jini specifik dhe tërheqës

Ktheni 5 opcione të ndryshme:` :
      `Create SEO-optimized titles in English for this car listing:

${listing.make} ${listing.model} ${listing.year}, ${listing.mileage} km, ${(listing.price / 100).toLocaleString()} EUR
Location: ${listing.city}

Keywords to include: ${keywords.join(', ')}

Requirements:
- Maximum 60 characters
- Include make, model, year
- Add price or location
- Use keywords popular in Albania
- Be specific and engaging

Return 5 different options:`;

    const aiResponse = await this.provider.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 200,
    });

    const titles = this.extractTitleOptions(aiResponse);
    const bestTitle = titles[0] || `${listing.make} ${listing.model} ${listing.year}`;

    return {
      content: bestTitle,
      metadata: {
        language,
        wordCount: bestTitle.split(/\s+/).length,
        readabilityScore: 0.9,
        seoScore: this.calculateSEOScore(bestTitle, listing),
        keywords: this.extractKeywords(bestTitle, language),
        tone: 'professional',
      },
      alternatives: titles.slice(1),
      suggestions: this.generateTitleSuggestions(bestTitle, listing),
      confidence: 0.9,
    };
  }

  private async generateSocialPost(context: any, language: string): Promise<GeneratedContent> {
    const { listing, tone = 'casual' } = context;
    const isAlbanian = language === 'sq';

    const prompt = isAlbanian ?
      `Krijoni një postim për rrjetet sociale (Facebook, Instagram) në shqip për këtë automjet:

${listing.make} ${listing.model} ${listing.year}
Çmimi: ${(listing.price / 100).toLocaleString()} EUR
Vendndodhja: ${listing.city}

Kërkesat:
- Ton miqësor dhe tërheqës
- Përdorni emoji të përshtatshme
- Shtoni hashtag relevant
- Maksimumi 280 karaktere
- Përfshini thirrje për veprim
- Theksoni pikën kryesore të shitjes

Ktheni 3 versione:` :
      `Create a social media post (Facebook, Instagram) in English for this vehicle:

${listing.make} ${listing.model} ${listing.year}
Price: ${(listing.price / 100).toLocaleString()} EUR
Location: ${listing.city}

Requirements:
- Friendly and engaging tone
- Use appropriate emojis
- Add relevant hashtags
- Maximum 280 characters
- Include call to action
- Highlight key selling point

Return 3 versions:`;

    const aiResponse = await this.provider.generateText(prompt, {
      temperature: 0.8,
      maxTokens: 300,
    });

    const { content, alternatives } = this.parseContentResponse(aiResponse);

    return {
      content,
      metadata: {
        language,
        wordCount: content.split(/\s+/).length,
        readabilityScore: 0.95,
        seoScore: 0.8,
        keywords: this.extractSocialKeywords(content, language),
        tone: 'casual',
      },
      alternatives: alternatives || [],
      suggestions: this.generateSocialSuggestions(content),
      confidence: 0.8,
    };
  }

  private async generateEmailTemplate(context: any, language: string): Promise<GeneratedContent> {
    const { listing, user, targetAudience = 'buyer' } = context;
    const isAlbanian = language === 'sq';

    const prompt = isAlbanian ?
      `Krijoni një template email në shqip për ${targetAudience === 'buyer' ? 'blerës' : 'shitës'} për këtë automjet:

AUTOMJETI: ${listing.make} ${listing.model} ${listing.year}
ÇMIMI: ${(listing.price / 100).toLocaleString()} EUR
SHITËSI: ${user?.name || 'Shitës'}

TIPI I EMAIL-IT: ${targetAudience === 'buyer' ? 'Konfirmim interesi nga blerësi' : 'Përgjigje ndaj interesit'}

Kërkesat:
- Përshëndetje e ngrohtë
- Informacion i qartë për automjetin
- Hapat e ardhshëm
- Informacion kontakti
- Ton profesional por miqësor
- Maksimumi 200 fjalë

Ktheni email të plotë me subjekt:` :
      `Create an email template in English for ${targetAudience} regarding this vehicle:

VEHICLE: ${listing.make} ${listing.model} ${listing.year}
PRICE: ${(listing.price / 100).toLocaleString()} EUR
SELLER: ${user?.name || 'Seller'}

EMAIL TYPE: ${targetAudience === 'buyer' ? 'Interest confirmation from buyer' : 'Response to inquiry'}

Requirements:
- Warm greeting
- Clear vehicle information
- Next steps
- Contact information
- Professional but friendly tone
- Maximum 200 words

Return complete email with subject:`;

    const aiResponse = await this.provider.generateText(prompt, {
      temperature: 0.6,
      maxTokens: 400,
    });

    const { subject, content } = this.parseEmailResponse(aiResponse);

    return {
      content,
      title: subject,
      metadata: {
        language,
        wordCount: content.split(/\s+/).length,
        readabilityScore: this.calculateReadabilityScore(content, language),
        seoScore: 0.7,
        keywords: this.extractKeywords(content, language),
        tone: 'professional',
      },
      alternatives: [],
      suggestions: this.generateEmailSuggestions(content),
      confidence: 0.85,
    };
  }

  private async generateAdCopy(context: any, language: string): Promise<GeneratedContent> {
    const { listing, length = 'short' } = context;
    const isAlbanian = language === 'sq';

    const prompt = isAlbanian ?
      `Krijoni një reklamë të shkurtër ${length === 'short' ? '25-50 fjalë' : '50-100 fjalë'} në shqip për këtë automjet:

${listing.make} ${listing.model} ${listing.year}
Çmimi: ${(listing.price / 100).toLocaleString()} EUR

Kërkesat:
- Tërheqës dhe bindës
- Theksoni vlerat kryesore
- Përfshini çmimin
- Shtoni urgjencë të lehtë
- Thirrje e qartë për veprim

Ktheni 3 versione:` :
      `Create a ${length === 'short' ? '25-50 word' : '50-100 word'} ad copy in English for this vehicle:

${listing.make} ${listing.model} ${listing.year}
Price: ${(listing.price / 100).toLocaleString()} EUR

Requirements:
- Compelling and persuasive
- Highlight key values
- Include price
- Add mild urgency
- Clear call to action

Return 3 versions:`;

    const aiResponse = await this.provider.generateText(prompt, {
      temperature: 0.8,
      maxTokens: 200,
    });

    const { content, alternatives } = this.parseContentResponse(aiResponse);

    return {
      content,
      metadata: {
        language,
        wordCount: content.split(/\s+/).length,
        readabilityScore: 0.9,
        seoScore: 0.85,
        keywords: this.extractKeywords(content, language),
        tone: 'urgent',
      },
      alternatives: alternatives || [],
      suggestions: this.generateAdSuggestions(content),
      confidence: 0.82,
    };
  }

  private getMaxTokensForLength(length: string): number {
    const tokenLimits: Record<string, number> = {
      short: 150,
      medium: 300,
      long: 500,
    };
    return tokenLimits[length] || 300;
  }

  private parseContentResponse(response: string): { content: string; alternatives?: string[] } {
    // Parse AI response to extract main content and alternatives
    const versionPattern = /VERSIONI?\s*\d+:?\s*\n?(.*?)(?=VERSIONI?\s*\d+|$)/gi;
    const matches = Array.from(response.matchAll(versionPattern));

    if (matches.length > 0) {
      return {
        content: matches[0][1].trim(),
        alternatives: matches.slice(1).map(match => match[1].trim()),
      };
    }

    return { content: response.trim() };
  }

  private parseEmailResponse(response: string): { subject: string; content: string } {
    const subjectMatch = response.match(/(?:SUBJEKTI?|SUBJECT):\s*(.*)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Lidhur me automjetin tuaj';

    // Remove subject line from content
    const content = response.replace(/(?:SUBJEKTI?|SUBJECT):.*\n?/i, '').trim();

    return { subject, content };
  }

  private extractTitleOptions(response: string): string[] {
    const lines = response.split('\n').filter(line => line.trim());
    return lines.slice(0, 5).map(line => line.replace(/^\d+\.\s*/, '').trim());
  }

  private calculateReadabilityScore(content: string, language: string): number {
    // Simplified readability calculation
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
    const avgCharsPerWord = content.replace(/\s/g, '').length / words.length;

    // Optimal ranges for Albanian/English
    const idealWordsPerSentence = language === 'sq' ? 15 : 18;
    const idealCharsPerWord = language === 'sq' ? 6 : 5;

    const sentenceScore = Math.max(0, 1 - Math.abs(avgWordsPerSentence - idealWordsPerSentence) / idealWordsPerSentence);
    const wordScore = Math.max(0, 1 - Math.abs(avgCharsPerWord - idealCharsPerWord) / idealCharsPerWord);

    return (sentenceScore + wordScore) / 2;
  }

  private calculateSEOScore(content: string, listing: any): number {
    let score = 0.5; // Base score

    const contentLower = content.toLowerCase();

    // Check for important keywords
    if (contentLower.includes(listing.make.toLowerCase())) score += 0.15;
    if (contentLower.includes(listing.model.toLowerCase())) score += 0.15;
    if (contentLower.includes(listing.year.toString())) score += 0.1;
    if (contentLower.includes(listing.city.toLowerCase())) score += 0.1;

    return Math.min(1, score);
  }

  private extractKeywords(content: string, language: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const stopWords = language === 'sq' ?
      albanianLanguageConfig.stopWords :
      ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

    const filteredWords = words.filter(word => !stopWords.includes(word));

    // Count word frequency
    const wordCounts = filteredWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return top keywords
    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractSocialKeywords(content: string, language: string): string[] {
    // Extract hashtags and mentions
    const hashtags = Array.from(content.matchAll(/#(\w+)/g)).map(match => match[1]);
    const keywords = this.extractKeywords(content, language);
    return [...hashtags, ...keywords.slice(0, 5)];
  }

  private generateContentSuggestions(content: string, metadata: any, listing: any): string[] {
    const suggestions: string[] = [];

    if (metadata.wordCount < 50) {
      suggestions.push(metadata.language === 'sq' ?
        'Shtoni më shumë detaje për të bërë përshkrimin më tërheqës.' :
        'Add more details to make the description more engaging.');
    }

    if (metadata.readabilityScore < 0.7) {
      suggestions.push(metadata.language === 'sq' ?
        'Përdorni fjali më të shkurtra për lexueshmëri më të mirë.' :
        'Use shorter sentences for better readability.');
    }

    if (metadata.seoScore < 0.8) {
      suggestions.push(metadata.language === 'sq' ?
        'Shtoni fjalë kyçe si vendndodhja dhe karakteristikat kryesore.' :
        'Add keywords like location and key features.');
    }

    if (!content.toLowerCase().includes(listing.city.toLowerCase())) {
      suggestions.push(metadata.language === 'sq' ?
        'Përmenndni vendndodhjen për SEO më të mirë.' :
        'Mention the location for better SEO.');
    }

    return suggestions;
  }

  private generateTitleSuggestions(title: string, listing: any): string[] {
    const suggestions: string[] = [];

    if (title.length > 60) {
      suggestions.push('Shkurtoni titullin për SEO më të mirë (maksimumi 60 karaktere).');
    }

    if (!title.includes(listing.year.toString())) {
      suggestions.push('Shtoni vitin për specifikimet më të mira.');
    }

    return suggestions;
  }

  private generateSocialSuggestions(content: string): string[] {
    const suggestions: string[] = [];

    if (!content.includes('#')) {
      suggestions.push('Shtoni hashtag për rrjetë sociale.');
    }

    if (!content.includes('📞') && !content.includes('📱')) {
      suggestions.push('Shtoni emoji për kontakt.');
    }

    return suggestions;
  }

  private generateEmailSuggestions(content: string): string[] {
    const suggestions: string[] = [];

    if (!content.includes('@') && !content.toLowerCase().includes('telefon')) {
      suggestions.push('Shtoni informacion kontakti.');
    }

    return suggestions;
  }

  private generateAdSuggestions(content: string): string[] {
    const suggestions: string[] = [];

    if (!content.toLowerCase().includes('tani') && !content.toLowerCase().includes('now')) {
      suggestions.push('Shtoni urgjencë për veprim të shpejtë.');
    }

    return suggestions;
  }

  private async optimizeForAlbanianMarket(content: GeneratedContent, context: any): Promise<GeneratedContent> {
    // Apply Albanian market-specific optimizations
    if (context.listing) {
      const { make, city } = context.listing;

      // Boost popular makes in Albania
      if (aiConfig.albanianMarket.popularMakes.includes(make)) {
        content.metadata.seoScore *= 1.1;
      }

      // Regional optimization
      if (['Tiranë', 'Durrës', 'Vlorë'].includes(city)) {
        content.metadata.seoScore *= 1.05;
      }
    }

    return content;
  }

  private async saveGeneratedContent(request: ContentGenerationRequest, result: GeneratedContent): Promise<void> {
    try {
      await prisma.generatedContent.create({
        data: {
          listingId: request.context.listing?.id || null,
          contentType: request.type,
          originalContent: request.originalContent || null,
          generatedContent: result.content,
          language: request.language,
          prompt: JSON.stringify(request.context),
          model: aiConfig.models.content.model,
          approved: false,
          usageCount: 0,
        },
      });
    } catch (error) {
      console.error('Failed to save generated content:', error);
    }
  }

  // Batch content generation for multiple listings
  async generateBatchContent(listingIds: string[], contentType: string): Promise<void> {
    for (const listingId of listingIds) {
      try {
        const listing = await prisma.listing.findUnique({
          where: { id: listingId },
          include: { user: true },
        });

        if (listing) {
          const request: ContentGenerationRequest = {
            type: contentType as any,
            language: 'sq',
            context: { listing, tone: 'professional', length: 'medium' },
          };

          const result = await this.generateContent(request);

          // Update listing with generated content
          if (contentType === 'listing_description') {
            await prisma.listing.update({
              where: { id: listingId },
              data: { aiGeneratedDescription: result.content },
            });
          } else if (contentType === 'seo_title') {
            await prisma.listing.update({
              where: { id: listingId },
              data: { seoTitle: result.content },
            });
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate content for listing ${listingId}:`, error);
      }
    }
  }
}

export default ContentGenerationService;