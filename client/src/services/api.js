import { mockProperties, mockPopularAreas } from '../data/mockProperties.js';
import { normalizeArabicText } from '../data/locationsData.js';
import { API_BASE_URL } from '../config/apiConfig.js';

export const propertyApi = {
  async getProperties(filters = {}, options = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.city) params.append('city', filters.city);
    if (filters.governorate) params.append('governorate', filters.governorate);
    if (filters.locations) {
      if (Array.isArray(filters.locations)) {
        filters.locations.forEach(loc => {
          if (loc && String(loc).trim()) params.append('locations', String(loc).trim());
        });
      } else if (typeof filters.locations === 'string' && filters.locations.trim()) {
        params.append('locations', filters.locations.trim());
      }
    }
    if (filters.accommodationType) params.append('accommodationType', filters.accommodationType);
    if (filters.genderPreference) params.append('genderPreference', filters.genderPreference);
    if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
    if (filters.isFurnished !== null && filters.isFurnished !== undefined) params.append('isFurnished', String(filters.isFurnished));
    if (filters.isVerified !== null && filters.isVerified !== undefined) params.append('isVerified', String(filters.isVerified));
    if (filters.includeDrafts) params.append('includeDrafts', 'true');
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    try {
      const res = await fetch(`${API_BASE_URL}/listings?${params.toString()}`, {
        signal: options.signal,
      });
      if (res.ok) {
        const json = await res.json();
        return {
          listings: json.data?.listings || [],
          total: json.data?.total || 0,
        };
      }
      const errJson = await res.json().catch(() => ({}));
      const error = new Error(errJson.message || `فشل استرجاع العقارات (رمز الخطأ: ${res.status})`);
      error.status = res.status;
      throw error;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }
      console.error('❌ [API] Network error while fetching listings:', err.message);
      const connErr = new Error('تعذر الاتصال بخادم سكنلي. يرجى التأكد من تشغيل السيرفر أو التحقق من الاتصال بالإنترنت.');
      connErr.isConnectionError = true;
      connErr.originalError = err;
      throw connErr;
    }
  },

  async getPropertyById(id, token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    try {
      const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: 'include',
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        return {
          listing: json?.data?.listing || null,
          similar: json?.data?.similar || [],
        };
      }
      return {
        listing: null,
        similar: [],
        error: {
          status: res.status,
          code: json?.code || (res.status === 404 ? 'NOT_FOUND' : 'ERROR'),
          listingStatus: json?.listingStatus || json?.data?.status || null,
          message: json?.message || 'عفواً، لم يتم العثور على هذا العقار.',
        },
      };
    } catch {
      // Fallback
      const listing = mockProperties.find(p => p.id === id) || null;
      if (listing) {
        const similar = mockProperties.filter(p => p.city === listing.city && p.id !== listing.id).slice(0, 3);
        return { listing, similar };
      }
      return {
        listing: null,
        similar: [],
        error: {
          status: 0,
          code: 'NETWORK_ERROR',
          message: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مجدداً.',
        },
      };
    }
  },

  async getIndividualBeds(options = {}) {
    try {
      const res = await fetch(`${API_BASE_URL}/listings/beds`, {
        signal: options.signal,
      });
      if (res.ok) {
        const json = await res.json();
        return json.data?.beds || [];
      }
      throw new Error(`خطأ في استرجاع الأسرة (رمز الخطأ: ${res.status})`);
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.error('❌ [API] Failed to fetch beds from backend:', err.message);
      throw new Error('تعذر الاتصال بخادم سكنلي لجلب الأسِرّة الفردية.');
    }
  },

  async getPopularAreas() {
    try {
      const res = await fetch(`${API_BASE_URL}/listings/areas`);
      if (res.ok) {
        const json = await res.json();
        return json.data?.areas || [];
      }
    } catch {
      // Fallback
    }
    return mockPopularAreas;
  },

  async submitViewingRequest(data, token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    try {
      const res = await fetch(`${API_BASE_URL}/listings/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
      const errJson = await res.json().catch(() => null);
      if (res.status === 401 || res.status === 403) {
        throw new Error(errJson?.message || 'يرجى تسجيل الدخول أولاً لإرسال طلب المعاينة.');
      }
    } catch (err) {
      if (err.message?.includes('تسجيل الدخول') || !authToken) {
        throw err;
      }
      // Network failure fallback only for authenticated clients
    }
    if (!authToken) {
      throw new Error('يرجى تسجيل الدخول أولاً لإرسال طلب المعاينة.');
    }
    return {
      status: 'success',
      message: 'تم إرسال طلب المعاينة بنجاح (نموذج تجريبي)',
      data: {
        requestId: `req-${Date.now()}`,
        status: 'pending_owner_confirmation',
        ...data,
      },
    };
  },

  async createListing(data, token) {
    const res = await fetch(`${API_BASE_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      const error = new Error(json.message || 'فشل حفظ أو نشر العقار');
      error.code = json.code;
      error.verificationStatus = json.verificationStatus;
      throw error;
    }
    return json.data || data;
  },

  async updateListing(id, data, token) {
    const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      const error = new Error(json.message || 'فشل تعديل بيانات العقار');
      error.code = json.code;
      error.verificationStatus = json.verificationStatus;
      throw error;
    }
    return json.data || data;
  },

  async updateListingStatus(id, status, token) {
    const res = await fetch(`${API_BASE_URL}/listings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });

    const json = await res.json();
    if (!res.ok) {
      const error = new Error(json.message || 'فشل تحديث حالة العقار');
      error.code = json.code;
      error.verificationStatus = json.verificationStatus;
      throw error;
    }
    return json.data;
  },

  async deleteListing(id, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        return true;
      }
    } catch {
      // Fallback
    }
    return true;
  },

  async getMyProperties(token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    try {
      const res = await fetch(`${API_BASE_URL}/listings/my/listings`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data?.listings || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getMyStats(token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    try {
      const res = await fetch(`${API_BASE_URL}/listings/my/stats`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch {
      // Fallback
    }
    return null;
  },

  async getMyInquiries(token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    try {
      const res = await fetch(`${API_BASE_URL}/listings/inquiries/my`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data?.inquiries || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async updateInquiryStatus(id, status, token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    const res = await fetch(`${API_BASE_URL}/listings/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'فشل تحديث حالة الطلب');
    }
    return json.data;
  },
};


export const authApi = {
  async register(data) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى.');
    }
    return result;
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل تسجيل الدخول، يرجى التأكد من البيانات.');
    }
    return result;
  },

  async googleAuth(credential, nonce) {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential,
        ...(nonce ? { nonce } : {}),
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل تسجيل الدخول عبر Google.');
    }
    return result;
  },

  async getProfile(token) {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'تعذر جلب بيانات الحساب.');
    }
    return result;
  },

  async updateProfile(token, profileData) {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل تحديث بيانات الملف الشخصي.');
    }
    return result;
  },

  async getVerificationStatus(token) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'تعذر جلب حالة التوثيق.');
    }
    return result.data;
  },

  async sendEmailVerificationOtp(token) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/email/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل إرسال رمز التحقق إلى البريد الإلكتروني.');
    }
    return result;
  },

  async verifyEmailVerificationOtp(token, otp) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/email/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ otp }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
    }
    return result;
  },

  async sendPhoneVerificationOtp(token, phone) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/phone/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل إرسال رمز التحقق للهاتف.');
    }
    return result;
  },

  async verifyPhoneVerificationOtp(token, phone, otp) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/phone/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone, otp }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
    }
    return result;
  },

  async saveVerificationAccountInfo(token, data) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/account-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل حفظ بيانات الحساب للتوثيق.');
    }
    return result;
  },

  async saveVerificationDoc(token, docData) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/doc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(docData),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل تسجيل المستند في ملف التوثيق.');
    }
    return result;
  },

  async removeVerificationDoc(token, docType, docId) {
    const q = docId ? `?docId=${encodeURIComponent(docId)}` : '';
    const res = await fetch(`${API_BASE_URL}/auth/verification/doc/${encodeURIComponent(docType)}${q}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل حذف المستند.');
    }
    return result;
  },

  async submitVerification(token, submissionData = {}) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(submissionData),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل إرسال طلب التوثيق.');
    }
    return result;
  },

  async reviewVerification(token, { userId, status, rejectionReason }) {
    const res = await fetch(`${API_BASE_URL}/auth/verification/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, status, rejectionReason }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل تحديث نتيجة مراجعة التوثيق.');
    }
    return result;
  },

  async forgotPassword(data) {
    // data can be { phone } or { email } or { identifier, method } or a string (phone or email)
    const payload = typeof data === 'string'
      ? (data.includes('@') ? { email: data, method: 'email' } : { phone: data, method: 'phone' })
      : data;

    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || result.isGoogleOnly) {
      const err = new Error(result.message || 'فشل إرسال رمز التحقق.');
      err.isGoogleOnly = Boolean(result.isGoogleOnly);
      err.response = { data: result };
      throw err;
    }
    return result;
  },

  async verifyResetOtp(identifier, otp, method) {
    const payload = typeof identifier === 'object'
      ? identifier
      : {
          identifier,
          phone: identifier && !identifier.includes('@') ? identifier : undefined,
          email: identifier && identifier.includes('@') ? identifier : undefined,
          otp,
          method: method || (identifier && identifier.includes('@') ? 'email' : 'phone'),
        };

    const res = await fetch(`${API_BASE_URL}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) {
      const err = new Error(result.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
      err.response = { data: result };
      throw err;
    }
    return result;
  },

  async resendResetOtp(identifier, method) {
    const payload = typeof identifier === 'object'
      ? identifier
      : {
          identifier,
          phone: identifier && !identifier.includes('@') ? identifier : undefined,
          email: identifier && identifier.includes('@') ? identifier : undefined,
          method: method || (identifier && identifier.includes('@') ? 'email' : 'phone'),
        };

    const res = await fetch(`${API_BASE_URL}/auth/resend-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) {
      const err = new Error(result.message || 'فشل إعادة إرسال الرمز.');
      err.response = { data: result };
      throw err;
    }
    return result;
  },

  async resetPassword({ resetToken, newPassword, confirmPassword }) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
    });
    const result = await res.json();
    if (!res.ok) {
      const err = new Error(result.message || 'فشل تحديث كلمة المرور.');
      err.response = { data: result };
      throw err;
    }
    return result;
  },

  async refresh() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return null;
  },

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }
  },
};

export const messagesApi = {
  async getConversations(token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const res = await fetch(`${API_BASE_URL}/messages/conversations`, {
      headers: {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل جلب المحادثات');
    }
    return result.data?.conversations || [];
  },

  async initiateConversation(data, token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const res = await fetch(`${API_BASE_URL}/messages/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل بدء المحادثة مع المالك');
    }
    return result.data?.conversation;
  },

  async getConversationById(id, token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const res = await fetch(`${API_BASE_URL}/messages/conversations/${id}`, {
      headers: {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل جلب تفاصيل المحادثة');
    }
    return result.data?.conversation;
  },

  async sendMessage(id, content, token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const body = typeof content === 'string' ? { text: content } : content;
    const res = await fetch(`${API_BASE_URL}/messages/conversations/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل إرسال الرسالة');
    }
    return result.data;
  },

  async markAsRead(id, token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const res = await fetch(`${API_BASE_URL}/messages/conversations/${id}/read`, {
      method: 'POST',
      headers: {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل تحديث حالة القراءة');
    }
    return result.data?.conversation;
  },

  async getUnreadCount(token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const res = await fetch(`${API_BASE_URL}/messages/unread-count`, {
      headers: {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
    });
    const result = await res.json();
    if (!res.ok) return 0;
    return result.data?.unreadCount || 0;
  },

  async updateViewingRequestStatus(requestId, status, token) {
    const res = await fetch(`${API_BASE_URL}/messages/requests/${requestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل تحديث حالة طلب المعاينة');
    }
    return result.data;
  },

  async reportConversation(id, reason, token) {
    const res = await fetch(`${API_BASE_URL}/messages/conversations/${id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل إرسال البلاغ');
    }
    return result.data;
  },
};

export const mediaApi = {
  /**
   * Request signed upload parameters from Backend
   */
  async getUploadSignature({ folderType = 'property_image', resourceType = 'image' } = {}, token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const res = await fetch(`${API_BASE_URL}/media/signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: JSON.stringify({ folderType, resourceType }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'تعذر إصدار تفويض الرفع الآمن.');
    }
    return result.data;
  },

  /**
   * Upload property media (images or video) via Backend Stream
   */
  async uploadMedia(files, { folderType = 'property_image' } = {}, token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];

    fileArray.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('folderType', folderType);

    const res = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل رفع الملفات إلى Cloudinary.');
    }
    return result.data?.media || [];
  },

  /**
   * Upload private owner verification documents
   */
  async uploadVerificationDocument(files, docType = 'national_id_front', token) {
    const activeToken = token || localStorage.getItem('sakanly_token');
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];

    fileArray.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('docType', docType);

    const res = await fetch(`${API_BASE_URL}/media/upload-verification`, {
      method: 'POST',
      headers: {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل رفع وتأمين مستند التوثيق.');
    }
    return result.data?.documents || [];
  },

  /**
   * Safely delete media asset from Cloudinary
   */
  async deleteMedia(publicId, { resourceType = 'image', type = 'upload' } = {}, token) {
    if (!publicId) return true;
    const activeToken = token || localStorage.getItem('sakanly_token');

    try {
      const res = await fetch(`${API_BASE_URL}/media/${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ resourceType, type }),
      });

      const result = await res.json();
      return result.success;
    } catch {
      // In case network dropped or skipped
      return false;
    }
  },

  /**
   * Upload user avatar to Cloudinary sakanly/users
   */
  async uploadAvatar(file, token) {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch(`${API_BASE_URL}/media/upload-avatar`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل رفع الصورة الشخصية.');
    }
    return result.data;
  },

  /**
   * Get short-lived signed URL for private verification document
   */
  async getPrivateDocumentSignedUrl(publicId, token, resourceType = 'image') {
    const res = await fetch(
      `${API_BASE_URL}/media/verification-document/${encodeURIComponent(publicId)}?resourceType=${resourceType}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'تعذر إصدار رابط المعاينة الآمن للمستند.');
    }
    return result.data?.signedUrl;
  },

  /**
   * Get Cloudinary connection and health status
   */
  async getMediaStatus(token) {
    const res = await fetch(`${API_BASE_URL}/media/status`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'فشل فحص حالة Cloudinary.');
    }
    return result.data;
  },
};

export const favoritesApi = {
  async getFavorites(token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    if (!authToken) return { favorites: [], properties: [] };
    try {
      const res = await fetch(`${API_BASE_URL}/favorites`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || { favorites: [], properties: [] };
      }
    } catch {
      // Fallback
    }
    return { favorites: [], properties: [] };
  },

  async addFavorite(listingId, token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    if (!authToken) throw new Error('يرجى تسجيل الدخول أولاً');
    const res = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ listingId }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || 'فشل إضافة العقار للمفضلة');
    return json?.data;
  },

  async removeFavorite(listingId, token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    if (!authToken) throw new Error('يرجى تسجيل الدخول أولاً');
    const res = await fetch(`${API_BASE_URL}/favorites/${listingId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      credentials: 'include',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || 'فشل حذف العقار من المفضلة');
    return json?.data;
  },
};

export const notificationsApi = {
  async getNotifications(token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    if (!authToken) return { notifications: [], total: 0, unreadCount: 0 };
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || { notifications: [], total: 0, unreadCount: 0 };
      }
    } catch {
      // Fallback
    }
    return { notifications: [], total: 0, unreadCount: 0 };
  },

  async markAsRead(id, token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    if (!authToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }
    return null;
  },

  async markAllAsRead(token) {
    const authToken = token || localStorage.getItem('sakanly_token');
    if (!authToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }
    return null;
  },
};



