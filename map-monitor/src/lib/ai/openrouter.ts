import axios from 'axios';
import { config } from '../../config';

export class OpenRouter {
    private baseUrl = 'https://openrouter.ai/api/v1';
    private apiKey: string;

    constructor() {
        this.apiKey = config.openRouter.apiKey;
    }

    async complete(params: {
        prompt: string;
        model?: string;
        temperature?: number;
        max_tokens?: number;
    }) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: params.model || 'deepseek-coder/deepseek-coder-1.3b-instruct',
                    messages: [
                        {
                            role: 'user',
                            content: params.prompt
                        }
                    ],
                    temperature: params.temperature || 0.1,
                    max_tokens: params.max_tokens || 1000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': 'https://map-monitor.com',
                        'X-Title': 'MAP Monitor'
                    }
                }
            );

            return this.parseAIResponse(response.data.choices[0].message.content);
        } catch (error) {
            throw new Error(`OpenRouter API error: ${error.message}`);
        }
    }

    private parseAIResponse(content: string): {
        price: number;
        isValidProduct: boolean;
        confidence: number;
        anomalies?: string[];
    } {
        try {
            // Attempt to parse JSON response
            const parsed = JSON.parse(content);
            return {
                price: Number(parsed.price),
                isValidProduct: Boolean(parsed.isValidProduct),
                confidence: Number(parsed.confidence),
                anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : undefined
            };
        } catch (error) {
            // Fallback parsing for non-JSON responses
            const priceMatch = content.match(/price:\s*(\d+\.?\d*)/i);
            const confidenceMatch = content.match(/confidence:\s*(\d+\.?\d*)/i);
            const isValidMatch = content.match(/valid:\s*(true|false)/i);
            
            return {
                price: priceMatch ? Number(priceMatch[1]) : 0,
                isValidProduct: isValidMatch ? isValidMatch[1].toLowerCase() === 'true' : false,
                confidence: confidenceMatch ? Number(confidenceMatch[1]) : 0,
                anomalies: []
            };
        }
    }
}
