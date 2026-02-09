
export enum ListingType {
  GOODS = 'GOODS',
  SKILL = 'SKILL'
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  SCHEDULED = 'SCHEDULED',
  HIDDEN = 'HIDDEN',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  LENDER = 'LENDER',
  BORROWER = 'BORROWER',
  MEMBER = 'MEMBER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED'
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string;
  trustScore: number; // 0-100
  vouchCount: number;
  verificationStatus: VerificationStatus;
  location: {
    lat: number;
    lng: number;
  };
  joinedDate: string;
  role: UserRole;
  status: UserStatus;
  twoFactorEnabled?: boolean;
}

export interface Listing {
  id: string;
  ownerId: string;
  borrowerId?: string; // ID of the user currently borrowing this item
  borrower?: User; // Hydrated field
  title: string;
  description: string;
  type: ListingType;
  category: string;
  imageUrl: string;
  gallery?: string[]; // Array of additional image URLs
  distanceMiles: number; // Calculated relative to current user
  status: AvailabilityStatus;
  hourlyRate?: number; // Price per hour
  autoApprove?: boolean; // If true, skips pending stage
  location: {
    x: number; // Relative coordinate for map viz
    y: number;
  };
  owner?: User; // Hydrated field
}

export interface BorrowHistoryItem {
  id: string;
  listing: Listing;
  borrowedDate: string;
  returnedDate: string;
}

export interface Review {
  id: string;
  authorId: string;
  targetUserId: string; // The person being reviewed (usually the lender)
  listingId: string;
  rating: number; // 1-5
  comment: string;
  timestamp: string;
  author?: User; // Hydrated
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Report {
  id: string;
  reason: string;
  details: string;
  timestamp: string;
  reporter?: {
    id: string;
    name: string;
    avatarUrl: string;
    trustScore: number;
  };
  listing?: {
    id: string;
    title: string;
    imageUrl: string;
    status: AvailabilityStatus;
    ownerId: string;
  };
}

