import { Router } from 'express';
import { ListingsController } from '../controllers/listingsController.js';
import { validateListingQuery, validateInquiry, validateCreateListing } from '../validators/listingValidator.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public listings search & discovery
router.get('/', validateListingQuery, ListingsController.getListings);
router.get('/beds', ListingsController.getIndividualBeds);
router.get('/areas', ListingsController.getPopularAreas);

// User & Owner Isolated Listings / Stats / Inquiries
router.get('/my/listings', requireAuth, requireRole('owner', 'admin'), ListingsController.getMyListings);
router.get('/my/stats', requireAuth, requireRole('owner', 'admin'), ListingsController.getMyStats);
router.get('/inquiries/my', requireAuth, ListingsController.getMyInquiries);
router.patch('/inquiries/:id/status', requireAuth, ListingsController.updateInquiryStatus);
router.post('/inquiry', requireAuth, validateInquiry, ListingsController.submitViewingRequest);

// Single listing by ID with optionalAuth for draft access control
router.get('/:id', optionalAuth, ListingsController.getListingById);

// Protected owner listing management (enforces authentication and owner role)
router.post('/', requireAuth, requireRole('owner', 'admin'), validateCreateListing, ListingsController.createListing);
router.put('/:id', requireAuth, requireRole('owner', 'admin'), ListingsController.updateListing);
router.patch('/:id/status', requireAuth, requireRole('owner', 'admin'), ListingsController.updateListingStatus);
router.delete('/:id', requireAuth, requireRole('owner', 'admin'), ListingsController.deleteListing);

export default router;

