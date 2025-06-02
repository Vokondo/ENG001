import express from 'express';
import { scrapeProduct } from '../services/scraper';
import { validateProductId } from '../lib/db/supabase';

const router = express.Router();

// POST /scrape/:productId
router.post('/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        // Validate product ID
        const isValid = await validateProductId(productId);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Trigger scraping
        const result = await scrapeProduct(productId);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error during scraping:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;