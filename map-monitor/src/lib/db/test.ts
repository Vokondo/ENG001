import { supabase, supabaseAdmin } from '../lib/db/supabase';
import { logger } from '../lib/logger/winston';

async function testConnection() {
    console.log('Testing Supabase connection...');

    try {
        // Test public client
        const { data: publicVersion, error: publicError } = await supabase
            .from('products')
            .select('count')
            .limit(1);

        if (publicError) throw new Error(`Public client error: ${publicError.message}`);
        console.log('✓ Public client connection successful');

        // Test admin client if available
        if (supabaseAdmin) {
            const { data: adminVersion, error: adminError } = await supabaseAdmin
                .from('products')
                .select('count')
                .limit(1);

            if (adminError) throw new Error(`Admin client error: ${adminError.message}`);
            console.log('✓ Admin client connection successful');
        }

        // Test RLS policies
        const testProduct = {
            name: 'Test Product',
            brand: 'Test Brand',
            map_price: 99.99,
            category: 'Test'
        };

        // Try inserting a product
        const { data: insertedProduct, error: insertError } = await supabaseAdmin!
            .from('products')
            .insert(testProduct)
            .select()
            .single();

        if (insertError) throw new Error(`Insert test failed: ${insertError.message}`);
        console.log('✓ Insert operation successful');

        // Clean up test data
        if (insertedProduct) {
            await supabaseAdmin!
                .from('products')
                .delete()
                .eq('id', insertedProduct.id);
        }

        console.log('✓ All connection tests passed!');
        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}

// Run test if this script is run directly
if (require.main === module) {
    testConnection().then(success => {
        if (!success) process.exit(1);
    });
}

export { testConnection };
