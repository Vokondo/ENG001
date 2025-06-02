export interface Violation {
    listing_id: string;
    price_difference: number;
    detected_at: Date;
    status: 'ACTIVE' | 'RESOLVED';
    confidence: number;
    severity: 'CRITICAL' | 'MINOR';
    anomalies?: string[];
}