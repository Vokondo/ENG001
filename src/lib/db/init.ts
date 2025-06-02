import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';
import { logger } from '../logger/winston';

// Database schema version
const SCHEMA_VERSION = '1';

async function checkSchemaVersion(): Promise<string | null> {
    const supabase = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey || '',
    );

    try {
        const { data, error } = await supabase
            .from('schema_versions')
            .select('version')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            logger.error('Error checking schema version:', error);
            return null;
        }

        return data?.version || null;
    } catch (error) {
        logger.error('Error checking schema version:', error);
        return null;
    }
}

async function updateSchemaVersion(): Promise<boolean> {
    const supabase = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey || '',
    );

    try {
        const { error } = await supabase
            .from('schema_versions')
            .insert({ version: SCHEMA_VERSION });

        if (error) {
            logger.error('Error updating schema version:', error);
            return false;
        }

        return true;
    } catch (error) {
        logger.error('Error updating schema version:', error);
        return false;
    }
}

export async function initializeDatabase() {
    logger.info('Starting database initialization...');

    // Check current schema version
    const currentVersion = await checkSchemaVersion();
    if (currentVersion === SCHEMA_VERSION) {
        logger.info('Database schema is up to date');
        return true;
    }

    const supabase = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey || '',
    );

    try {
        // Create schema_versions table if it doesn't exist
        await supabase.rpc('create_schema_versions_table');
        logger.info('✓ Schema versions table ready');

        // Create main tables
        await supabase.rpc('create_products_table');
        logger.info('✓ Products table created');

        await supabase.rpc('create_listings_table');
        logger.info('✓ Listings table created');

        await supabase.rpc('create_violations_table');
        logger.info('✓ Violations table created');

        // Create indexes
        await supabase.rpc('create_indexes');
        logger.info('✓ Indexes created');

        // Update schema version
        if (await updateSchemaVersion()) {
            logger.info('✓ Schema version updated successfully');
        }

        logger.info('Database initialization complete!');
        return true;
    } catch (error) {
        logger.error('Error during database initialization:', error);
        return false;
    }
}

// Run initialization if this script is run directly
if (require.main === module) {
    initializeDatabase().then(success => {
        if (!success) process.exit(1);
    });
}
