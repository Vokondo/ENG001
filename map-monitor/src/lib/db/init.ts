import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

async function initializeDatabase() {
    const supabase = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey || '',
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true
            }
        }
    );

    try {
        // Create tables
        console.log('Creating tables...');

        // Products table
        await supabase.rpc('create_products_table');
        console.log('✓ Products table created');

        // Listings table
        await supabase.rpc('create_listings_table');
        console.log('✓ Listings table created');

        // Violations table
        await supabase.rpc('create_violations_table');
        console.log('✓ Violations table created');

        // Create indexes
        console.log('Creating indexes...');
        await supabase.rpc('create_indexes');
        console.log('✓ Indexes created');

        // Create RLS policies
        console.log('Setting up Row Level Security...');
        
        // Products policies
        await supabase.rpc('setup_products_policies');
        
        // Listings policies
        await supabase.rpc('setup_listings_policies');
        
        // Violations policies
        await supabase.rpc('setup_violations_policies');
        
        console.log('✓ RLS policies created');

        console.log('Database initialization complete!');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

// Run initialization if this script is run directly
if (require.main === module) {
    initializeDatabase();
}

export { initializeDatabase };
