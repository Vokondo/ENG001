import { Violation } from '../models/violation';
import { supabase } from '../lib/db/supabase';
import { logger } from '../lib/logger/winston';
import { shouldNotifyViolation } from './violation-detector';

interface NotificationConfig {
    emailEnabled: boolean;
    slackEnabled: boolean;
    emailRecipients: string[];
    slackWebhookUrl?: string;
}

export class NotificationService {
    private config: NotificationConfig;

    constructor(config: NotificationConfig) {
        this.config = config;
    }

    async processViolation(violation: Violation): Promise<void> {
        try {
            if (!shouldNotifyViolation(violation)) {
                logger.debug('Skipping notification for non-critical violation', {
                    violation_id: violation.listing_id,
                    severity: violation.severity,
                    confidence: violation.confidence
                });
                return;
            }

            // Get listing and product details
            const { data: listing } = await supabase
                .from('listings')
                .select('*, products(*)')
                .eq('id', violation.listing_id)
                .single();

            if (!listing) {
                throw new Error(`Listing not found for violation: ${violation.listing_id}`);
            }

            const message = this.formatViolationMessage(violation, listing);

            if (this.config.emailEnabled) {
                await this.sendEmail(message);
            }

            if (this.config.slackEnabled && this.config.slackWebhookUrl) {
                await this.sendSlackNotification(message);
            }

            logger.info('Violation notification sent', {
                violation_id: violation.listing_id,
                severity: violation.severity,
                confidence: violation.confidence,
                channels: {
                    email: this.config.emailEnabled,
                    slack: this.config.slackEnabled
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Failed to process violation notification: ${errorMessage}`);
        }
    }

    private formatViolationMessage(violation: Violation, listing: any): string {
        const severity = violation.severity === 'CRITICAL' ? '🚨 CRITICAL' : '⚠️ MINOR';
        const confidence = (violation.confidence * 100).toFixed(1);
        
        return `
${severity} MAP Violation Detected

Product: ${listing.products.name}
Brand: ${listing.products.brand}
Retailer URL: ${listing.url}
Price Difference: $${violation.price_difference.toFixed(2)}
Detection Confidence: ${confidence}%
${violation.anomalies?.length ? `\nAnomalies Detected:\n${violation.anomalies.join('\n')}` : ''}

Detected at: ${violation.detected_at.toLocaleString()}
        `.trim();
    }

    private async sendEmail(message: string): Promise<void> {
        // Implementation would use your preferred email service
        // For example: SendGrid, AWS SES, etc.
        logger.info('Email notification would be sent', { 
            recipients: this.config.emailRecipients,
            message 
        });
    }

    private async sendSlackNotification(message: string): Promise<void> {
        if (!this.config.slackWebhookUrl) {
            return;
        }

        try {
            const response = await fetch(this.config.slackWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: message })
            });

            if (!response.ok) {
                throw new Error(`Slack notification failed: ${response.statusText}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Failed to send Slack notification: ${errorMessage}`);
        }
    }
}