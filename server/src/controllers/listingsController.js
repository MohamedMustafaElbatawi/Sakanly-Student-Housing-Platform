import mongoose from 'mongoose';
import { Listing } from '../models/Listing.js';
import { isMongoConnected } from '../config/database.js';
import { ListingsService } from '../services/listingsService.js';
import { CloudinaryService } from '../services/cloudinaryService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { InquiriesStore } from '../data/mockInquiriesData.js';
import { PlatformSettingsStore } from '../data/platformSettings.js';
import { NotificationsStore } from '../data/mockNotificationsData.js';
import { normalizeEgyptianPhone, toInternationalFormat } from '../services/smsService.js';

export class ListingsController {
  static getListings(req, res, next) {
    try {
      const listings = ListingsService.getAll(req.query);
      return ApiResponse.success(res, {
        listings,
        total: listings.length,
        filtersApplied: req.query,
      }, 'Listings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getMyListings(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول أولاً.' });
      }
      const listings = await ListingsService.getByOwner(req.user.id);
      return ApiResponse.success(res, {
        listings,
        total: listings.length,
      }, 'Owner listings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getMyStats(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول أولاً.' });
      }
      const stats = await ListingsService.getStatsByOwner(req.user.id);
      const inquiries = InquiriesStore.getByOwner(req.user.id);
      stats.totalInquiries = inquiries.length;
      stats.pendingInquiries = inquiries.filter(i => i.status === 'pending_owner_confirmation' || i.status === 'pending').length;
      return ApiResponse.success(res, stats, 'Owner stats retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static _respondWithListing(req, res, listing, id) {
    const isPublic = listing.status === 'active' || listing.status === 'published';
    if (!isPublic) {
      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
      const isOwner = req.user && (
        listing.owner?.id === req.user.id ||
        listing.owner?.id === String(req.user._id) ||
        listing.ownerId === req.user.id ||
        (req.user.role === 'owner' && req.user.email && listing.owner?.email === req.user.email)
      );

      if (!isAdmin && !isOwner) {
        let code = 'NOT_FOUND';
        let message = `Listing not found with ID: ${id}`;
        if (listing.status === 'pending_review' || listing.status === 'pending') {
          code = 'LISTING_PENDING_REVIEW';
          message = 'هذا العقار قيد المراجعة الإدارية والتدقيق حالياً ولم يُنشر للطلاب بعد.';
        } else if (listing.status === 'rejected') {
          code = 'LISTING_REJECTED';
          message = 'هذا العقار غير متاح حالياً.';
        } else if (listing.status === 'draft') {
          code = 'LISTING_DRAFT';
          message = 'هذا العقار مسودة خاصة بمالك السكن.';
        } else if (listing.status === 'rented' || listing.status === 'paused') {
          code = 'LISTING_UNAVAILABLE';
          message = 'عفواً، هذا السكن تم تأجيره أو غير متاح حالياً.';
        }
        return res.status(404).json({
          status: 'error',
          success: false,
          statusCode: 404,
          code,
          listingStatus: listing.status,
          message,
        });
      }
    }

    const similar = ListingsService.getAll({ city: listing.city })
      .filter(item => item.id !== listing.id)
      .slice(0, 3);

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    const isOwner = req.user && (
      listing.owner?.id === req.user.id ||
      listing.owner?.id === String(req.user._id) ||
      listing.ownerId === req.user.id ||
      (req.user.role === 'owner' && req.user.email && listing.owner?.email === req.user.email)
    );

    let outputListing = typeof listing.toObject === 'function' ? listing.toObject() : { ...listing };

    // Privacy Gate: If owner does not permit showing contact phone to students/public
    if (!isAdmin && !isOwner) {
      if (outputListing.showContactPhone === false) {
        outputListing.contactPhone = null;
        outputListing.whatsappPhone = null;
        if (outputListing.owner) {
          outputListing.owner = {
            ...outputListing.owner,
            phone: null,
          };
        }
      }
    }

    return ApiResponse.success(res, { listing: outputListing, similar }, 'Listing details retrieved successfully');
  }

  static getListingById(req, res, next) {
    try {
      const { id } = req.params;
      const listing = ListingsService.getById(id);

      if (listing) {
        return ListingsController._respondWithListing(req, res, listing, id);
      }

      if (isMongoConnected()) {
        const query = { $or: [{ id: String(id) }] };
        if (mongoose.isValidObjectId(String(id))) {
          query.$or.push({ _id: String(id) });
        }
        Listing.findOne(query).lean().then(dbDoc => {
          if (dbDoc) {
            ListingsService._cacheListing(dbDoc);
            return ListingsController._respondWithListing(req, res, dbDoc, id);
          }
          return res.status(404).json({
            status: 'error',
            success: false,
            statusCode: 404,
            code: 'NOT_FOUND',
            message: `Listing not found with ID: ${id}`,
          });
        }).catch(next);
        return;
      }

      return res.status(404).json({
        status: 'error',
        success: false,
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `Listing not found with ID: ${id}`,
      });
    } catch (err) {
      next(err);
    }
  }

  static getIndividualBeds(req, res, next) {
    try {
      const beds = ListingsService.getIndividualBeds();
      return ApiResponse.success(res, {
        beds,
        total: beds.length,
      }, 'Individual beds retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static getPopularAreas(req, res, next) {
    try {
      const areas = ListingsService.getPopularAreas();
      return ApiResponse.success(res, { areas }, 'Popular areas retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static submitViewingRequest(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً لإرسال طلب المعاينة.',
        });
      }

      const listingId = req.body.listingId;
      const fullName = req.body.fullName || req.body.applicant?.fullName || req.user.fullName;
      const phone = req.body.phone || req.body.applicant?.phone || req.user.phone || '';
      const email = req.body.email || req.body.applicant?.email || req.user.email || '';
      const moveInDate = req.body.moveInDate || '';
      const message = req.body.message || '';

      const listing = ListingsService.getById(listingId);
      if (!listing) {
        return ApiResponse.error(res, `Cannot request viewing for non-existing listing ${listingId}`, 404);
      }

      // Strict User Identity: applicant is ALWAYS authenticated req.user
      const inquiry = InquiriesStore.create({
        applicant: {
          id: req.user.id,
          fullName: req.user.fullName || fullName,
          phone: req.user.phone || phone || '',
          email: req.user.email || email || '',
        },
        ownerId: listing.owner?.id,
        listingId: listing.id,
        listingTitle: listing.title,
        moveInDate: moveInDate || '',
        message: message || '',
        status: 'pending_owner_confirmation',
      });

      // Notify owner of the new viewing request
      if (listing.owner?.id) {
        NotificationsStore.create({
          recipientId: listing.owner.id,
          title: 'طلب معاينة جديد 📅',
          message: `قدم الطالب ${req.user.fullName || 'أحد الطلاب'} طلباً لمعاينة عقارك "${listing.title}".`,
          type: 'request',
          targetId: inquiry.id,
          targetType: 'inquiry',
        });
      }

      return ApiResponse.success(res, inquiry, 'تم تسجيل طلب المعاينة وإخطار المالك بنجاح', 201);
    } catch (err) {
      next(err);
    }
  }

  static getMyInquiries(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول أولاً.' });
      }

      let inquiries = [];
      if (req.user.role === 'admin') {
        inquiries = InquiriesStore.getAll();
      } else if (req.user.role === 'owner') {
        inquiries = InquiriesStore.getByOwner(req.user.id);
      } else {
        // Student
        inquiries = InquiriesStore.getByStudent(req.user.id);
      }

      return ApiResponse.success(res, { inquiries, total: inquiries.length }, 'Inquiries retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static updateInquiryStatus(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول أولاً.' });
      }

      const { id } = req.params;
      const { status } = req.body;
      const inquiry = InquiriesStore.getById(id);
      if (!inquiry) {
        return ApiResponse.error(res, 'طلب المعاينة غير موجود', 404);
      }

      // Strict Ownership: Only the property owner (or admin / super_admin) can update inquiry status
      const isAdminUser = req.user.role === 'admin' || req.user.role === 'super_admin';
      if (!isAdminUser && inquiry.ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'غير مصرح: لا تملك صلاحية تعديل حالة طلب معاينة لعقار مالك آخر.',
        });
      }

      const updated = InquiriesStore.updateStatus(id, status);
      return ApiResponse.success(res, updated, 'تم تحديث حالة طلب المعاينة بنجاح');
    } catch (err) {
      next(err);
    }
  }


  static createListing(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً لإضافة العقارات.',
        });
      }

      // 1. Role enforcement: Students are strictly forbidden from creating/publishing listings
      if (req.user.role === 'student') {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح: حسابات الطلاب لا تملك صلاحية إضافة أو نشر العقارات. هذه الميزة مخصصة لملّاك العقارات فقط.',
        });
      }

      // 2. Owner verification enforcement on publishing
      const isVerifiedOwner = (req.user.verificationStatus === 'verified' && req.user.isVerified === true) || req.user.role === 'admin' || req.user.role === 'super_admin';
      const requestedStatus = req.body.status || 'pending_review';

      // Unverified owners are strictly barred from publishing live listings
      if (req.user.role === 'owner' && !isVerifiedOwner) {
        if (requestedStatus !== 'draft') {
          return res.status(403).json({
            success: false,
            code: 'OWNER_NOT_VERIFIED',
            verificationStatus: req.user.verificationStatus || 'not_started',
            message: 'عذراً، لا يمكنك نشر عقار جديد للطلاب قبل اعتماد وتوثيق حسابك من قِبل إدارة سكنلي. يمكنك فقط حفظ الإعلان كمسودة مؤقتة حتى اكتمال التوثيق.',
          });
        }
      }

      // Read platform policy for auto-approving verified owner listings
      const platformSettings = PlatformSettingsStore.getSettings ? PlatformSettingsStore.getSettings() : {};
      const autoApprove = platformSettings.autoApproveVerifiedOwnerListings === true;
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

      let enforcedStatus;
      if (requestedStatus === 'draft') {
        enforcedStatus = 'draft';
      } else if (isAdmin) {
        enforcedStatus = requestedStatus || 'active';
      } else if (autoApprove && isVerifiedOwner) {
        enforcedStatus = 'active';
      } else {
        // Default policy: verified owners' new listings require administrative review before public publishing
        enforcedStatus = 'pending_review';
      }

      const enforcedVerified = (enforcedStatus === 'active' && isVerifiedOwner);

      // Normalize media array, images and video
      let media = Array.isArray(req.body.media) ? req.body.media : [];
      let images = Array.isArray(req.body.images) ? [...req.body.images] : [];

      // If media objects provided, extract URLs into images array if not present
      if (media.length > 0 && images.length === 0) {
        images = media
          .filter(m => (m.resource_type !== 'video' && !/\.(mp4|webm|mov)$/i.test(m.secure_url || m.url || m)))
          .map(m => m.secure_url || m.url || m)
          .filter(Boolean);
      }

      // Normalize video object
      let video = null;
      if (req.body.video) {
        if (typeof req.body.video === 'string') {
          video = {
            url: req.body.video,
            secure_url: req.body.video,
            resource_type: 'video',
            thumbnail_url: req.body.video.replace(/\.[^/.]+$/, ".jpg"),
          };
        } else if (typeof req.body.video === 'object') {
          video = {
            ...req.body.video,
            resource_type: 'video',
            thumbnail_url: req.body.video.thumbnail_url || req.body.video.poster_url || (req.body.video.secure_url ? req.body.video.secure_url.replace(/\.[^/.]+$/, ".jpg") : null),
          };
        }
      } else if (media.length > 0) {
        const vidItem = media.find(m => m.resource_type === 'video' || (typeof m === 'string' && /\.(mp4|webm|mov)$/i.test(m)));
        if (vidItem) {
          video = typeof vidItem === 'object' ? vidItem : { url: vidItem, secure_url: vidItem, resource_type: 'video' };
        }
      }

      // Contact phone normalization & backend validation
      let normalizedContactPhone = null;
      if (req.body.contactPhone) {
        const norm = normalizeEgyptianPhone(req.body.contactPhone);
        if (!norm) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_CONTACT_PHONE',
            message: 'رقم هاتف التواصل غير صحيح. يرجى إدخال رقم هاتف محمول مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015.',
          });
        }
        normalizedContactPhone = toInternationalFormat(norm);
      } else if (req.user?.phone) {
        const norm = normalizeEgyptianPhone(req.user.phone);
        if (norm) normalizedContactPhone = toInternationalFormat(norm);
      }

      let normalizedWhatsappPhone = null;
      if (req.body.whatsappPhone) {
        const norm = normalizeEgyptianPhone(req.body.whatsappPhone);
        if (!norm) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_WHATSAPP_PHONE',
            message: 'رقم الواتساب غير صحيح. يرجى إدخال رقم هاتف محمول مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015.',
          });
        }
        normalizedWhatsappPhone = toInternationalFormat(norm);
      }

      const showContactPhone = req.body.showContactPhone !== undefined
        ? Boolean(req.body.showContactPhone)
        : true;

      const listingData = {
        ...req.body,
        media,
        images,
        video,
        contactPhone: normalizedContactPhone,
        whatsappPhone: normalizedWhatsappPhone,
        showContactPhone,
        status: enforcedStatus,
        isVerified: enforcedVerified,
        submittedAt: enforcedStatus === 'pending_review' ? new Date().toISOString() : null,
        owner: {
          id: req.user.id,
          name: req.user.fullName,
          phone: normalizedContactPhone || req.user.phone || '+20100000000',
          avatar: req.user.avatar || '',
          verificationStatus: req.user.verificationStatus || 'not_started',
          memberSince: '2026',
          ...req.body.owner,
        },
      };

      const listing = ListingsService.create(listingData);

      // Send informative notification to owner when entering review queue
      if (listing.status === 'pending_review') {
        NotificationsStore.create({
          recipientId: req.user.id,
          title: 'تم إرسال عقارك للمراجعة الإدارية',
          message: `تم استلام عقارك "${listing.title}" وهو قيد الفحص والمراجعة الإدارية من قِبل إدارة سكنلي.`,
          type: 'info',
        });
      }

      let message = 'تم إنشاء ونشر العقار بنجاح.';
      if (listing.status === 'draft') {
        message = 'تم حفظ العقار كمسودة بنجاح. لن يظهر الإعلان للطلاب إلا بعد استكمال واعتماد توثيق حسابك.';
      } else if (listing.status === 'pending_review') {
        message = 'تم إرسال العقار للمراجعة الإدارية بنجاح. سيتم فحصه واعتماده من قِبل إدارة سكنلي قبل إتاحته للطلاب.';
      }

      return ApiResponse.success(res, listing, message, 201);
    } catch (err) {
      next(err);
    }
  }

  static updateListingStatus(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً لتعديل العقار.',
        });
      }

      if (req.user.role === 'student') {
        return res.status(403).json({
          success: false,
          code: 'ROLE_FORBIDDEN',
          message: 'غير مصرح: حسابات الطلاب لا تملك صلاحية تعديل حالة العقارات.',
        });
      }

      const { id } = req.params;
      const { status } = req.body;

      const existing = ListingsService.getById(id);
      if (!existing) {
        return ApiResponse.error(res, 'العقار غير موجود', 404);
      }

      // 1. Strict Ownership Enforcement: Owner can only modify their own property
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
      if (!isAdmin && existing.owner?.id && existing.owner.id !== req.user.id) {
        return res.status(403).json({
          success: false,
          code: 'NOT_PROPERTY_OWNER',
          message: 'غير مصرح: لا يمكنك تعديل حالة هذا العقار لأنه مسجل لمالك آخر.',
        });
      }

      let targetStatus = status;
      let extraFields = {};

      // 2. Verification enforcement when activating/publishing
      if (status === 'active' || status === 'published') {
        const isVerifiedOwner = (req.user.verificationStatus === 'verified' && req.user.isVerified === true) || isAdmin;
        if (!isVerifiedOwner) {
          return res.status(403).json({
            success: false,
            code: 'OWNER_NOT_VERIFIED',
            verificationStatus: req.user.verificationStatus || 'not_started',
            message: 'لا يمكنك تفعيل أو نشر العقار للطلاب قبل اعتماد وتوثيق حسابك من قِبل إدارة سكنلي.',
          });
        }

        const platformSettings = PlatformSettingsStore.getSettings ? PlatformSettingsStore.getSettings() : {};
        const autoApprove = platformSettings.autoApproveVerifiedOwnerListings === true;

        // If not admin and autoApprove is disabled, submitting from draft or rejected routes to admin review
        if (!isAdmin && !autoApprove && (existing.status === 'draft' || existing.status === 'rejected' || existing.status === 'pending_review')) {
          targetStatus = 'pending_review';
          extraFields = {
            submittedAt: new Date().toISOString(),
            rejectionReason: null,
          };

          NotificationsStore.create({
            recipientId: req.user.id,
            title: 'تم إرسال العقار للمراجعة',
            message: `تم إرسال عقارك "${existing.title}" للمراجعة الإدارية.`,
            type: 'info',
          });
        }
      }

      const listing = ListingsService.updateStatus(id, targetStatus, extraFields);
      const msg = targetStatus === 'pending_review'
        ? 'تم إرسال العقار للمراجعة الإدارية وسيقوم فريق العمل بفحصه واعتماده.'
        : 'تم تحديث حالة العقار بنجاح';

      return ApiResponse.success(res, listing, msg);
    } catch (err) {
      next(err);
    }
  }

  static updateListing(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً لتعديل العقار.',
        });
      }

      if (req.user.role === 'student') {
        return res.status(403).json({
          success: false,
          code: 'ROLE_FORBIDDEN',
          message: 'غير مصرح: حسابات الطلاب لا تملك صلاحية تعديل العقارات.',
        });
      }

      const { id } = req.params;
      const existing = ListingsService.getById(id);
      if (!existing) {
        return ApiResponse.error(res, 'العقار غير موجود', 404);
      }

      // Strict Ownership check
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
      if (!isAdmin && existing.owner?.id && existing.owner.id !== req.user.id) {
        return res.status(403).json({
          success: false,
          code: 'NOT_PROPERTY_OWNER',
          message: 'غير مصرح: لا يمكنك تعديل بيانات هذا العقار لأنه مسجل لمالك آخر.',
        });
      }

      const requestedStatus = req.body.status || existing.status;
      const isVerifiedOwner = (req.user.verificationStatus === 'verified' || req.user.isVerified === true || isAdmin);

      if ((requestedStatus === 'active' || requestedStatus === 'published') && !isVerifiedOwner) {
        return res.status(403).json({
          success: false,
          code: 'OWNER_NOT_VERIFIED',
          verificationStatus: req.user.verificationStatus || 'not_started',
          message: 'لا يمكنك نشر أو تفعيل العقار قبل اعتماد وتوثيق حسابك.',
        });
      }

      // If owner modifies a rejected property or explicitly submits for review
      const updateData = { ...req.body };

      if (req.body.contactPhone !== undefined) {
        if (req.body.contactPhone) {
          const norm = normalizeEgyptianPhone(req.body.contactPhone);
          if (!norm) {
            return res.status(400).json({
              success: false,
              code: 'INVALID_CONTACT_PHONE',
              message: 'رقم هاتف التواصل غير صحيح. يرجى إدخال رقم هاتف محمول مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015.',
            });
          }
          updateData.contactPhone = toInternationalFormat(norm);
        } else {
          updateData.contactPhone = null;
        }
      }

      if (req.body.whatsappPhone !== undefined) {
        if (req.body.whatsappPhone) {
          const norm = normalizeEgyptianPhone(req.body.whatsappPhone);
          if (!norm) {
            return res.status(400).json({
              success: false,
              code: 'INVALID_WHATSAPP_PHONE',
              message: 'رقم الواتساب غير صحيح. يرجى إدخال رقم هاتف محمول مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015.',
            });
          }
          updateData.whatsappPhone = toInternationalFormat(norm);
        } else {
          updateData.whatsappPhone = null;
        }
      }

      if (req.body.showContactPhone !== undefined) {
        updateData.showContactPhone = Boolean(req.body.showContactPhone);
      }

      if (!isAdmin && (existing.status === 'rejected' || req.body.status === 'pending_review')) {
        updateData.status = 'pending_review';
        updateData.rejectionReason = null;
        updateData.submittedAt = new Date().toISOString();

        NotificationsStore.create({
          recipientId: req.user.id,
          title: 'تمت إعادة إرسال العقار للمراجعة',
          message: `تم تعديل بيانات عقارك "${existing.title}" وإعادة إرساله للمراجعة الإدارية.`,
          type: 'info',
        });
      }

      // Cleanup orphan media if items were removed in updated listing
      if (Array.isArray(existing.media) && Array.isArray(req.body.media)) {
        const newPublicIds = new Set(req.body.media.map(m => m.public_id).filter(Boolean));
        const removedMedia = existing.media.filter(m => m.public_id && !newPublicIds.has(m.public_id));
        if (removedMedia.length > 0) {
          // Delete asynchronously in background to not block response
          CloudinaryService.deleteMultipleMedia(removedMedia).catch(err => {
            console.error('[Listing Update] Failed to cleanup removed media:', err);
          });
        }
      }

      // Cleanup orphan video if replaced or removed
      if (existing.video && existing.video.public_id) {
        const hasSameVideo = req.body.video && (req.body.video.public_id === existing.video.public_id || req.body.video === existing.video.url || req.body.video === existing.video.secure_url);
        if (req.body.video === null || (req.body.video !== undefined && !hasSameVideo)) {
          CloudinaryService.deleteMedia(existing.video.public_id, 'video').catch(err => {
            console.error('[Listing Update] Failed to delete replaced video:', err);
          });
        }
      }

      const updated = ListingsService.update(id, updateData);
      return ApiResponse.success(res, updated, 'تم تعديل بيانات العقار بنجاح');
    } catch (err) {
      next(err);
    }
  }

  static async deleteListing(req, res, next) {
    try {
      const { id } = req.params;
      const existing = ListingsService.getById(id);
      if (!existing) {
        return ApiResponse.error(res, 'العقار غير موجود', 404);
      }

      // Strict Ownership check
      if (req.user.role !== 'admin' && existing.owner?.id && existing.owner.id !== req.user.id) {
        return res.status(403).json({
          success: false,
          code: 'NOT_PROPERTY_OWNER',
          message: 'غير مصرح: لا يمكنك حذف عقار مسجل لمالك آخر.',
        });
      }

      // Safe Cloudinary Media Deletion: Delete all associated media
      if (Array.isArray(existing.media) && existing.media.length > 0) {
        await CloudinaryService.deleteMultipleMedia(existing.media);
      } else if (Array.isArray(existing.images)) {
        // Fallback: Check if images contain cloudinary public_ids
        const cloudinaryItems = existing.images
          .filter(url => typeof url === 'string' && url.includes('cloudinary.com'))
          .map(url => {
            // Extract public_id from url
            const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
            return matches ? { public_id: matches[1], resource_type: 'image' } : null;
          })
          .filter(Boolean);

        if (cloudinaryItems.length > 0) {
          await CloudinaryService.deleteMultipleMedia(cloudinaryItems);
        }
      }

      const success = ListingsService.delete(id);
      return ApiResponse.success(res, { deletedId: id }, 'تم حذف العقار ووسائطه من Cloudinary بنجاح');
    } catch (err) {
      next(err);
    }
  }
}

