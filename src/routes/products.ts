import express from 'express';
import { supabase } from '../lib/db/supabase';
import { auth } from '../lib/clerk/auth';

const router = express.Router();

// Middleware for authentication
router.use(auth);

// GET /products - List current products with violations
router.get('/', async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('has_violation', true); // Assuming there's a field to indicate violations

        if (error) {
            throw error;
        }

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;