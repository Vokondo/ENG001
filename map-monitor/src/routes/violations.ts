import { Router } from 'express';
import { getCurrentViolations } from '../services/violation-detector';

const router = Router();

// GET /violations - List current violations
router.get('/', async (req, res) => {
    try {
        const violations = await getCurrentViolations();
        res.json(violations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve violations' });
    }
});

export default router;