import { logger } from '../lib/logger/winston';

export interface Violation {
    listing_id: string;
    price_difference: number;
    detected_at: Date;
    status: 'ACTIVE' | 'RESOLVED';
    severity?: 'CRITICAL' | 'MINOR';
    confidence?: number;
}

// Configuration for violation severity levels
const CRITICAL_THRESHOLD = 15; // 15% below MAP is considered critical

export function detectViolation(currentPrice: number, mapPrice: number): Omit<Violation, 'listing_id'> | null {
    try {
        const priceDifference = mapPrice - currentPrice;
        const percentageDifference = (priceDifference / mapPrice) * 100;

        if (priceDifference <= 0) {
            return null; // No violation if price is at or above MAP
        }

        return {
            price_difference: priceDifference,
            detected_at: new Date(),
            status: 'ACTIVE',
            severity: percentageDifference >= CRITICAL_THRESHOLD ? 'CRITICAL' : 'MINOR',
            confidence: 1.0, // This will be overwritten with AI confidence
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error detecting violation: ${errorMessage}`);
        return null;
    }
}

export function shouldNotifyViolation(violation: Violation): boolean {
    return violation.severity === 'CRITICAL' && violation.confidence >= 0.8;
}

function generateListingId(): string {
    // Logic to generate a unique listing ID
    return 'unique-listing-id'; // Placeholder implementation
}