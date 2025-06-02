import { BrightDataMCP } from '../lib/brightdata/mcp';
import { supabase } from '../lib/db/supabase';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger/winston';
import { detectViolation } from './violation-detector';
import { OpenRouter } from '../lib/ai/openrouter';

interface AIAnalysisResult {
    price: number;
    isValidProduct: boolean;
    confidence: number;
    anomalies?: string[];
}

const brightDataMCP = new BrightDataMCP();
const openRouter = new OpenRouter();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

async function analyzeWithAI(htmlContent: string, productDetails: { name: string; brand: string }): Promise<AIAnalysisResult> {
    const prompt = `
    You are a product price analyzer. Analyze this HTML content and extract the following information in JSON format:
    1. Current price (number)
    2. Whether this is the correct product based on these details: ${productDetails.name}, ${productDetails.brand} (true/false)
    3. Confidence score between 0 and 1
    4. List any pricing anomalies found (e.g., bundle deals, special offers)

    Respond only with JSON in this format:
    {
        "price": number,
        "isValidProduct": boolean,
        "confidence": number,
        "anomalies": string[]
    }

    HTML Content:
    ${htmlContent.substring(0, 2000)} // Limit content length
    `;

    try {
        return await openRouter.complete({
            prompt,
            model: 'deepseek-coder/deepseek-coder-1.3b-instruct',
            temperature: 0.1,
            max_tokens: 500
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`AI analysis failed: ${errorMessage}`);
        throw error;
    }
}

export const scrapeProduct = async (productId: string) => {
    try {
        // Check rate limit
        const requests = await redis.incr(`ratelimit:${productId}`);
        if (requests === 1) {
            await redis.pexpire(`ratelimit:${productId}`, RATE_LIMIT_WINDOW);
        }
        
        if (requests > MAX_REQUESTS_PER_WINDOW) {
            throw new Error('Rate limit exceeded for this product');
        }

        // Get product details
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            throw new Error(`Product not found: ${productError?.message || 'Unknown error'}`);
        }

        // Get existing listings
        const { data: existingListings, error: listingsError } = await supabase
            .from('listings')
            .select('*')
            .eq('product_id', productId);

        if (listingsError) {
            throw new Error(`Failed to fetch listings: ${listingsError.message}`);
        }

        // Scrape and analyze current prices
        const scrapedListings = await Promise.all(
            (existingListings || []).map(async (listing) => {
                try {
                    const { htmlContent } = await brightDataMCP.scrape(listing.url);
                    const aiAnalysis = await analyzeWithAI(htmlContent, {
                        name: product.name,
                        brand: product.brand
                    });

                    // Skip if AI determines this is not the correct product
                    if (!aiAnalysis.isValidProduct || aiAnalysis.confidence < 0.7) {
                        logger.warn(`Low confidence or product mismatch for listing ${listing.id}`, {
                            confidence: aiAnalysis.confidence,
                            isValidProduct: aiAnalysis.isValidProduct
                        });
                        return null;
                    }

                    return {
                        ...listing,
                        last_price: aiAnalysis.price,
                        last_scraped: new Date(),
                        confidence: aiAnalysis.confidence,
                        anomalies: aiAnalysis.anomalies
                    };
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    logger.error(`Failed to scrape/analyze listing ${listing.id}: ${errorMessage}`);
                    return null;
                }
            })
        );

        // Update listings and check for violations
        const validListings = scrapedListings.filter((listing): listing is NonNullable<typeof listing> => listing !== null);
        
        for (const listing of validListings) {
            try {
                // Update listing with AI analysis data
                const { error: updateError } = await supabase
                    .from('listings')
                    .update({
                        last_price: listing.last_price,
                        last_scraped: listing.last_scraped,
                        confidence: listing.confidence,
                        anomalies: listing.anomalies
                    })
                    .eq('id', listing.id);

                if (updateError) {
                    throw new Error(`Failed to update listing: ${updateError.message}`);
                }

                // Check for violation if confidence is high enough
                if (listing.confidence >= 0.7) {
                    const violation = detectViolation(listing.last_price, product.map_price);
                    if (violation) {
                        const { error: violationError } = await supabase
                            .from('violations')
                            .insert({
                                ...violation,
                                listing_id: listing.id,
                                confidence: listing.confidence,
                                anomalies: listing.anomalies
                            });

                        if (violationError) {
                            logger.error(`Failed to insert violation: ${violationError.message}`);
                        }
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger.error(`Failed to process listing ${listing.id}: ${errorMessage}`);
                continue;
            }
        }

        return {
            success: true,
            scrapedCount: validListings.length,
            totalListings: existingListings?.length || 0,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Scraping failed for product ID ${productId}: ${errorMessage}`);
        throw error;
    }
};

const detectViolations = async (listings: any[], mapPrice: number) => {
    const violations = listings
        .filter(listing => listing.price < mapPrice)
        .map(listing => ({
            listing_id: listing.id,
            price_difference: mapPrice - listing.price,
            detected_at: new Date(),
            status: 'active',
        }));

    return violations;
};

const logViolations = async (violations: any[]) => {
    for (const violation of violations) {
        await supabase
            .from('violations')
            .insert(violation);
    }
};