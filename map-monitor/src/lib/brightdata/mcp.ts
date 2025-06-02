import axios from 'axios';
import { config } from '../../config';

export class BrightDataMCP {
    private baseUrl: string;
    private auth: string;

    constructor() {
        this.baseUrl = `https://${config.brightData.host}`;
        this.auth = Buffer.from(
            `${config.brightData.username}:${config.brightData.password}`
        ).toString('base64');
    }

    async scrape(url: string) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/scrape`,
                {
                    url,
                    // Add additional configuration for human-like browsing
                    options: {
                        waitForSelector: '.price', // Adjust based on target sites
                        timeout: 30000,
                        userAgent: 'random', // Use random user agents
                        cookies: true, // Enable cookie handling
                    },
                },
                {
                    headers: {
                        Authorization: `Basic ${this.auth}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Bright Data MCP scraping error:', error);
            throw error;
        }
    }
}
