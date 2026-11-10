import { API_BASE_URL } from '../config/apiConfig.js';

const adminFetch = async (endpoint, options = {}, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || 'حدث خطأ في معالجة طلب الإدارة');
    error.status = res.status;
    error.code = data.code;
    throw error;
  }

  return data;
};

export const adminApi = {
  // Authentication & Session
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'بيانات الدخول غير صحيحة.');
    }
    return data;
  },

  getProfile(token) {
    return adminFetch('/me', {}, token);
  },

  getStats(token) {
    return adminFetch('/stats', {}, token);
  },

  // Users Management
  getUsers(token, params = {}) {
    const q = new URLSearchParams(params).toString();
    return adminFetch(`/users${q ? '?' + q : ''}`, {}, token);
  },

  getUserById(token, userId) {
    return adminFetch(`/users/${userId}`, {}, token);
  },

  suspendUser(token, userId, reason = '') {
    return adminFetch(`/users/${userId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }, token);
  },

  unsuspendUser(token, userId) {
    return adminFetch(`/users/${userId}/unsuspend`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }, token);
  },

  // Owners Verification Queue
  getVerificationQueue(token, status = 'pending_review') {
    return adminFetch(`/owners/verification-queue?status=${status}`, {}, token);
  },

  getOwnerVerificationDocs(token, ownerId) {
    return adminFetch(`/owners/${ownerId}/verification-docs`, {}, token);
  },

  verifyOwner(token, ownerId) {
    return adminFetch(`/owners/${ownerId}/verify`, {
      method: 'POST',
      body: JSON.stringify({}),
    }, token);
  },

  rejectOwner(token, ownerId, rejectionReason) {
    return adminFetch(`/owners/${ownerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    }, token);
  },

  requestOwnerCorrection(token, ownerId, correctionReason, specificCorrections = []) {
    return adminFetch(`/owners/${ownerId}/request-correction`, {
      method: 'POST',
      body: JSON.stringify({ correctionReason, specificCorrections }),
    }, token);
  },

  // Listings Management
  getListings(token, params = {}) {
    const q = new URLSearchParams(params).toString();
    return adminFetch(`/listings${q ? '?' + q : ''}`, {}, token);
  },

  getListingById(token, listingId) {
    return adminFetch(`/listings/${listingId}`, {}, token);
  },

  updateListingStatus(token, listingId, status, rejectionReason = '', correctionReason = '') {
    return adminFetch(`/listings/${listingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason, correctionReason }),
    }, token);
  },

  // Inquiries / Viewing Requests
  getInquiries(token, params = {}) {
    const q = new URLSearchParams(params).toString();
    return adminFetch(`/inquiries${q ? '?' + q : ''}`, {}, token);
  },

  // Reports
  getReports(token, params = {}) {
    const q = new URLSearchParams(params).toString();
    return adminFetch(`/reports${q ? '?' + q : ''}`, {}, token);
  },

  resolveReport(token, reportId, action, notes = '') {
    return adminFetch(`/reports/${reportId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ action, notes }),
    }, token);
  },

  // Conversations & Direct Messages inspection
  getConversations(token) {
    return adminFetch('/conversations', {}, token);
  },

  // System Notifications
  getNotifications(token) {
    return adminFetch('/notifications', {}, token);
  },

  broadcastNotification(token, payload) {
    return adminFetch('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  // Owners with Performance & Metrics
  getOwners(token, params = {}) {
    const q = new URLSearchParams(params).toString();
    return adminFetch(`/owners${q ? '?' + q : ''}`, {}, token);
  },

  // Analytics & Commercial Intelligence
  getAnalytics(token) {
    return adminFetch('/analytics', {}, token);
  },

  // Chat System Indicators (Privacy Preserved)
  getChatMetrics(token) {
    return adminFetch('/chat-metrics', {}, token);
  },

  // Platform Settings
  getPlatformSettings(token) {
    return adminFetch('/settings', {}, token);
  },

  updatePlatformSettings(token, settings) {
    return adminFetch('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }, token);
  },

  // Security Logs & Credentials Management
  getSecurityLogs(token) {
    return adminFetch('/security/logs', {}, token);
  },

  changeAdminPassword(token, currentPassword, newPassword) {
    return adminFetch('/security/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }, token);
  },

  // Audit Log
  getAuditLog(token, params = {}) {
    const q = new URLSearchParams(params).toString();
    return adminFetch(`/audit-log${q ? '?' + q : ''}`, {}, token);
  },
};

