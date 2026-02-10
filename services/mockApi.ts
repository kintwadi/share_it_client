
import { MOCK_USERS } from '../data/mockData';
import { Listing, User, Message, AvailabilityStatus, BorrowHistoryItem, Review, UserStatus, VerificationStatus } from '../types';

export const API_BASE = (window as any).__API_BASE__ || 'http://localhost:8081';
const STORAGE_USER_ID = 'nearshare_current_user_id';
const TOKEN_KEY = 'nearshare_token';

const getToken = () => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
const setToken = (t: string) => sessionStorage.setItem(TOKEN_KEY, t);
const setCurrentUserId = (id: string) => sessionStorage.setItem(STORAGE_USER_ID, id);
const getCurrentUserId = () => sessionStorage.getItem(STORAGE_USER_ID) || localStorage.getItem(STORAGE_USER_ID);
const clearSession = () => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(STORAGE_USER_ID); };

const authFetch = async (path: string, init?: RequestInit) => {
  const token = getToken();
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers as Record<string, string> || {}) } });
  if (res.status === 401) { clearSession(); throw new Error('unauthorized'); }
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'request_failed'); }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

const toUser = (u: any): User => ({
  id: String(u.id),
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  address: u.address || '',
  avatarUrl: (u.avatarUrl && !u.avatarUrl.startsWith('blob:')) ? u.avatarUrl : '',
  trustScore: u.trustScore ?? 0,
  vouchCount: u.vouchCount ?? 0,
  verificationStatus: u.verificationStatus,
  location: { lat: u.location?.x ?? 0, lng: u.location?.y ?? 0 },
  joinedDate: u.joinedDate || new Date().toISOString(),
  role: u.role,
  status: u.status || UserStatus.ACTIVE,
  twoFactorEnabled: !!u.twoFactorEnabled,
});

const toListing = (l: any): Listing => ({
  id: String(l.id),
  ownerId: String(l.ownerId),
  borrowerId: l.borrowerId ? String(l.borrowerId) : undefined,
  title: l.title,
  description: l.description,
  type: l.type,
  category: l.category,
  imageUrl: (l.imageUrl && !l.imageUrl.startsWith('blob:')) ? l.imageUrl : '',
  gallery: (l.gallery || []).filter((g: string) => !g.startsWith('blob:')),
  distanceMiles: l.distanceMiles ?? 0,
  status: l.status,
  hourlyRate: l.hourlyRate,
  autoApprove: l.autoApprove,
  location: { x: l.location?.x ?? 0, y: l.location?.y ?? 0 },
  owner: l.owner ? toUser(l.owner) : undefined,
  borrower: l.borrower ? toUser(l.borrower) : undefined,
});

const toMessage = (m: any): Message => ({
  id: String(m.id), senderId: String(m.senderId), receiverId: String(m.receiverId), content: m.content, imageUrl: (m.imageUrl && !String(m.imageUrl).startsWith('blob:')) ? String(m.imageUrl) : undefined, timestamp: m.timestamp, isRead: !!m.isRead,
});

export const mockApi = {
  login: async (userId: string): Promise<User> => {
    const found = MOCK_USERS.find(u => u.id === userId);
    if (!found) throw new Error('User not found');
    const payload = { email: found.email, password: 'password123' };
    const data = await authFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    setCurrentUserId(String(data.user.id));
    const user = toUser(data.user);
    if (user.status === UserStatus.BLOCKED) throw new Error('Account is blocked. Contact support.');
    return user;
  },

  loginWithEmail: async (email: string, password: string): Promise<User> => {
    const data = await authFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.mfaRequired) {
      throw { code: 'MFA_REQUIRED', token: data.token };
    }
    setToken(data.token);
    setCurrentUserId(String(data.user.id));
    return toUser(data.user);
  },

  verify2FALogin: async (code: string, token: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/api/auth/verify-2fa-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
    });
    if (!res.ok) throw new Error('Invalid code');
    const data = await res.json();
    setToken(data.token);
    setCurrentUserId(String(data.user.id));
    return toUser(data.user);
  },

  registerUser: async (name: string, email: string, password: string, isAdmin?: boolean): Promise<User> => {
    const cfg = await mockApi.getPublicConfig();
    const body = { name, email, password, phone: '', address: '', avatarUrl: '', lat: 0.0, lng: 0.0, isAdmin: !!isAdmin && !!cfg.allowAdminToggle };
    await authFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
    const data = await authFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token);
    setCurrentUserId(String(data.user.id));
    return toUser(data.user);
  },

  logout: async (): Promise<void> => {
    clearSession();
  },

  // Password Recovery Methods
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    return await authFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  verifyResetCode: async (email: string, code: string): Promise<{ valid: boolean; token?: string }> => {
    return await authFetch('/api/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return await authFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  },

  getReports: async (): Promise<any[]> => {
    return authFetch('/api/admin/reports');
  },

  dismissReport: async (id: string): Promise<void> => {
    await authFetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const data = await authFetch('/api/users/me');
      return toUser(data);
    } catch {
      return null;
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    const data = await authFetch('/api/users/');
    return (data as any[]).map(toUser);
  },
  getPublicConfig: async (): Promise<{ allowAdminToggle?: boolean; stripePublicKey?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/config/public`);
      if (!res.ok) return { allowAdminToggle: false };
      return await res.json();
    } catch {
      return { allowAdminToggle: false };
    }
  },

  updateUser: async (updates: Partial<User>): Promise<User> => {
    const data = await authFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify(updates) });
    return toUser(data);
  },
  
  // Admin function to update any user status
  updateUserStatus: async (userId: string, status: UserStatus): Promise<User> => {
    const data = await authFetch(`/api/users/${userId}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    return toUser(data);
  },

  // User requests verification
  getPublicConfig: async () => {
    return authFetch('/api/config/public');
  },

  addPaymentMethod: async (paymentMethodId: string) => {
    return authFetch('/api/payment/methods', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId })
    });
  },

  getPaymentMethods: async () => {
    return authFetch('/api/payment/methods');
  },

  requestVerification: async (data: { address: string, phone: string }): Promise<User> => {
    const resp = await authFetch('/api/users/verification-request', { method: 'POST', body: JSON.stringify(data) });
    return toUser(resp);
  },

  // Admin approves verification
  approveVerification: async (userId: string): Promise<User> => {
    const data = await authFetch(`/api/users/${userId}/approve-verification`, { method: 'POST' });
    return toUser(data);
  },

  setup2FA: async (): Promise<{ secret: string, qrCode: string }> => {
    return authFetch('/api/users/2fa/setup', { method: 'POST' });
  },

  verify2FA: async (code: string): Promise<void> => {
    await authFetch('/api/users/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) });
  },

  disable2FA: async (): Promise<void> => {
    await authFetch('/api/users/2fa/disable', { method: 'POST' });
  },

  // Admin revokes verification
  revokeVerification: async (userId: string): Promise<User> => {
    const data = await authFetch(`/api/users/${userId}/revoke-verification`, { method: 'POST' });
    return toUser(data);
  },

  vouchForUser: async (targetUserId: string): Promise<User> => {
    const data = await authFetch(`/api/users/${targetUserId}/vouch`, { method: 'POST' });
    return toUser(data);
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<boolean> => {
    await authFetch('/api/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    return true;
  },

  deleteAccount: async (): Promise<boolean> => {
    clearSession();
    return true;
  },

  getListings: async (): Promise<Listing[]> => {
    const page = await authFetch('/api/listings/?page=0&size=100');
    return (page.content || []).map(toListing);
  },

  getRecommendedListings: async (size: number = 6): Promise<Listing[]> => {
    try {
      const list = await authFetch(`/api/listings/recommended?size=${size}`);
      return (list as any[]).map(toListing);
    } catch {
      return [];
    }
  },

  getListingById: async (id: string): Promise<Listing | null> => {
    try {
      const l = await authFetch(`/api/listings/${id}`);
      return toListing(l);
    } catch { return null; }
  },

  getBorrowingHistory: async (): Promise<BorrowHistoryItem[]> => {
    const user = await mockApi.getCurrentUser();
    if (!user) return [];
    const listings = await mockApi.getListings();
    const borrowed = listings.filter(l => l.borrowerId === user.id);
    const now = new Date();
    return borrowed.map((l, idx) => ({
      id: `hist_${l.id}_${idx}`,
      listing: l,
      borrowedDate: now.toISOString().slice(0, 10),
      returnedDate: l.status === AvailabilityStatus.BORROWED ? '' : now.toISOString().slice(0, 10),
    }));
  },

  // Simulating a simple search
  searchListings: async (query: string): Promise<Listing[]> => {
    const page = await authFetch(`/api/listings/?search=${encodeURIComponent(query)}&page=0&size=100`);
    return (page.content || []).map(toListing);
  },

  updateListing: async (updatedListing: Listing): Promise<Listing> => {
    const body = {
      title: updatedListing.title,
      description: updatedListing.description,
      category: updatedListing.category,
      type: updatedListing.type,
      hourlyRate: updatedListing.hourlyRate ?? 0,
      imageUrl: updatedListing.imageUrl,
      gallery: updatedListing.gallery || [],
      autoApprove: !!updatedListing.autoApprove,
      x: updatedListing.location?.x ?? 0,
      y: updatedListing.location?.y ?? 0,
    };
    try {
      const existing = await mockApi.getListingById(updatedListing.id);
      if (!existing) {
        const created = await authFetch('/api/listings/', { method: 'POST', body: JSON.stringify(body) });
        return toListing(created);
      }
      const data = await authFetch(`/api/listings/${updatedListing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      return toListing(data);
    } catch (e) {
      // Fallback create on error
      const created = await authFetch('/api/listings/', { method: 'POST', body: JSON.stringify(body) });
      return toListing(created);
    }
  },

  deleteListing: async (id: string): Promise<boolean> => {
    await authFetch(`/api/listings/${id}`, { method: 'DELETE' });
    return true;
  },

  toggleListingBlock: async (id: string): Promise<Listing> => {
    const data = await authFetch(`/api/listings/${id}/block`, { method: 'POST' });
    return toListing(data);
  },

  dismissRecommendation: async (id: string): Promise<boolean> => {
    await authFetch(`/api/listings/${id}/dismiss`, { method: 'POST' });
    return true;
  },

  borrowItem: async (listingId: string, request: { paymentMethod: string, paymentToken: string, durationHours: number }): Promise<boolean> => {
    await authFetch(`/api/listings/${listingId}/borrow`, { method: 'POST', body: JSON.stringify(request) });
    return true;
  },
  
  approveRequest: async (listingId: string): Promise<boolean> => {
    await authFetch(`/api/listings/${listingId}/approve`, { method: 'POST' });
    return true;
  },

  denyRequest: async (listingId: string): Promise<boolean> => {
    await authFetch(`/api/listings/${listingId}/deny`, { method: 'POST' });
    return true;
  },

  returnItem: async (listingId: string): Promise<boolean> => {
    await authFetch(`/api/listings/${listingId}/return`, { method: 'POST' });
    return true;
  },

  reportListing: async (listingId: string, reason: string, details: string): Promise<boolean> => {
    await authFetch(`/api/listings/${listingId}/report`, { method: 'POST', body: JSON.stringify({ reason, details }) });
    return true;
  },

  getConversations: async (): Promise<User[]> => {
    const list = await authFetch('/api/messages/conversations');
    return (list as any[]).map(toUser);
  },
  getContacts: async (): Promise<User[]> => {
    const list = await authFetch('/api/users/contacts');
    return (list as any[]).map(u => ({
      id: String(u.id), name: u.name, trustScore: u.trustScore ?? 0, avatarUrl: u.avatarUrl || '',
      email: '', phone: '', address: '', role: 'MEMBER', location: { lat: 0, lng: 0 }, joinedDate: '', status: 'ACTIVE', vouchCount: 0, verificationStatus: 'UNVERIFIED'
    }));
  },

  getMessages: async (otherUserId: string): Promise<Message[]> => {
    const msgs = await authFetch(`/api/messages/with/${otherUserId}`);
    return (msgs as any[]).map(toMessage);
  },
  getInbox: async (): Promise<Message[]> => {
    const msgs = await authFetch('/api/messages/inbox');
    return (msgs as any[]).map(toMessage);
  },
  getOutbox: async (): Promise<Message[]> => {
    const msgs = await authFetch('/api/messages/outbox');
    return (msgs as any[]).map(toMessage);
  },

  sendMessage: async (receiverId: string, content: string): Promise<Message> => {
    const m = await authFetch('/api/messages/', { method: 'POST', body: JSON.stringify({ receiverId, content }) });
    return toMessage(m);
  },
  sendImageMessage: async (receiverId: string, imageUrl: string): Promise<Message> => {
    const m = await authFetch('/api/messages/', { method: 'POST', body: JSON.stringify({ receiverId, imageUrl }) });
    return toMessage(m);
  },
  deleteMessage: async (id: string): Promise<boolean> => {
    await authFetch(`/api/messages/${id}`, { method: 'DELETE' });
    return true;
  },

  getOnlineUserIds: async (): Promise<string[]> => {
    const list = await authFetch('/api/users/online');
    return (list as any[]).map((id: any) => String(id));
  },

  getReviews: async (targetUserId: string): Promise<Review[]> => {
    const list = await authFetch(`/api/reviews/user/${targetUserId}`);
    return (list as any[]).map(r => ({
      id: String(r.id), authorId: String(r.authorId), targetUserId: String(r.targetUserId), listingId: String(r.listingId), rating: r.rating, comment: r.comment, timestamp: r.timestamp,
    }));
  },

  submitReview: async (reviewData: Omit<Review, 'id' | 'timestamp' | 'author'>): Promise<Review> => {
    const r = await authFetch('/api/reviews/', { method: 'POST', body: JSON.stringify(reviewData) });
    return { id: String(r.id), authorId: String(r.authorId), targetUserId: String(r.targetUserId), listingId: String(r.listingId), rating: r.rating, comment: r.comment, timestamp: r.timestamp };
  },
  


  addPaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await authFetch('/api/payment/methods', { method: 'POST', body: JSON.stringify({ paymentMethodId }) });
  },

  getPaymentMethods: async (): Promise<any[]> => {
    return authFetch('/api/payment/methods');
  },

  createPaymentIntent: async (amount: number, currency: string, listingId: string, durationHours: number = 0): Promise<{ clientSecret: string }> => {
    return authFetch('/api/payment/create-payment-intent', { 
        method: 'POST', 
        body: JSON.stringify({ amount, currency, listingId, durationHours }) 
    });
  }
};

export const uploadApi = {
  uploadUserAvatar: async (file: File): Promise<User> => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const data = await authFetch('/api/users/me/avatar', { method: 'POST', body: fd });
      return toUser(data);
    } catch (e) {
      try {
        const presign = await authFetch('/api/storage/presign-upload', { 
          method: 'POST', 
          body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream' }) 
        });
        const { uploadUrl, objectUrl } = presign as any;
        await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
        const url = objectUrl as string;
        const updated = await authFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify({ avatarUrl: url }) });
        return toUser(updated);
      } catch (err) {
        try {
          const alt = new FormData();
          alt.append('file', file);
          const up = await authFetch('/api/storage/upload', { method: 'POST', body: alt });
          const url = (up as any).url as string;
          const updated = await authFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify({ avatarUrl: url }) });
          return toUser(updated);
        } catch {
          throw err instanceof Error ? err : new Error('upload_failed');
        }
      }
    }
  },
  uploadListingImage: async (file: File): Promise<string> => {
    try {
      const presign = await authFetch('/api/storage/presign-upload', { 
        method: 'POST', 
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream' }) 
      });
      const { uploadUrl, objectUrl } = presign as any;
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      return objectUrl as string;
    } catch {
      const fd = new FormData();
      fd.append('file', file);
      const data = await authFetch('/api/storage/upload', { method: 'POST', body: fd });
      return (data as any).url as string;
    }
  }
};
