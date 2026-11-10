import { Router } from 'express';
import { FavoritesController } from '../controllers/favoritesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All favorites endpoints strictly require authenticated user
router.use(requireAuth);

router.get('/', FavoritesController.getFavorites);
router.post('/', FavoritesController.addFavorite);
router.delete('/:listingId', FavoritesController.removeFavorite);

export default router;
