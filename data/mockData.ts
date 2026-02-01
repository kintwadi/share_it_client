
import { User, Listing, ListingType, AvailabilityStatus, Message, UserRole, Review, UserStatus, VerificationStatus } from '../types';

export const DEFAULT_USER_ID = 'user_borrower';

export const MOCK_USERS: User[] = [
  {
    id: 'user_borrower',
    name: 'Bob Borrower',
    email: 'bob.borrower@example.com',
    phone: '+1 (818) 555-0101',
    address: '123 Maple Avenue, North Hills, CA 91343',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    trustScore: 45,
    vouchCount: 2,
    verificationStatus: VerificationStatus.UNVERIFIED,
    location: { lat: -0.002, lng: -0.002 },
    joinedDate: '2023-09-01',
    role: UserRole.BORROWER,
    status: UserStatus.ACTIVE
  },
  {
    id: 'user_lender',
    name: 'Linda Lender',
    email: 'linda.lender@example.com',
    phone: '+1 (818) 555-0102',
    address: '456 Oak Street, Apt 4B, North Hills, CA 91343',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    trustScore: 98,
    vouchCount: 156,
    verificationStatus: VerificationStatus.VERIFIED,
    location: { lat: 0.002, lng: 0.002 },
    joinedDate: '2021-05-15',
    role: UserRole.LENDER,
    status: UserStatus.ACTIVE
  },
  {
    id: 'user_admin',
    name: 'Alice Admin',
    email: 'admin@nearshare.local',
    phone: '+1 (800) 555-9999',
    address: 'NearShare HQ, North Hills, CA 91343',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
    trustScore: 100,
    vouchCount: 500,
    verificationStatus: VerificationStatus.VERIFIED,
    location: { lat: 0, lng: 0 },
    joinedDate: '2020-01-01',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE
  },
  {
    id: 'user_unverified_demo',
    name: 'New Neighbor',
    email: 'new.neighbor@example.com',
    phone: '',
    address: '',
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    trustScore: 10,
    vouchCount: 0,
    verificationStatus: VerificationStatus.UNVERIFIED,
    location: { lat: 0.005, lng: -0.005 },
    joinedDate: '2023-11-01',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE
  },
  {
    id: 'user_1',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (818) 555-0103',
    address: '789 Pine Road, North Hills, CA 91343',
    avatarUrl: 'https://picsum.photos/id/64/100/100',
    trustScore: 92,
    vouchCount: 15,
    verificationStatus: VerificationStatus.UNVERIFIED,
    location: { lat: 0, lng: 0 },
    joinedDate: '2023-01-15',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE
  },
  {
    id: 'user_2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    phone: '+1 (818) 555-0104',
    address: '321 Cedar Lane, North Hills, CA 91343',
    avatarUrl: 'https://picsum.photos/id/65/100/100',
    trustScore: 98,
    vouchCount: 42,
    verificationStatus: VerificationStatus.VERIFIED,
    location: { lat: 0.01, lng: 0.01 },
    joinedDate: '2022-11-05',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE
  },
  {
    id: 'user_3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+1 (818) 555-0105',
    address: '654 Elm Court, North Hills, CA 91343',
    avatarUrl: 'https://picsum.photos/id/91/100/100',
    trustScore: 85,
    vouchCount: 8,
    verificationStatus: VerificationStatus.PENDING,
    location: { lat: -0.005, lng: 0.005 },
    joinedDate: '2023-03-20',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE
  },
  {
    id: 'user_4',
    name: 'Emma Wilson',
    email: 'emma.wilson@example.com',
    phone: '+1 (818) 555-0106',
    address: '987 Birch Way, North Hills, CA 91343',
    avatarUrl: 'https://picsum.photos/id/103/100/100',
    trustScore: 78,
    vouchCount: 4,
    verificationStatus: VerificationStatus.UNVERIFIED,
    location: { lat: 0.002, lng: -0.01 },
    joinedDate: '2023-06-01',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE
  }
];

export const MOCK_LISTINGS: Listing[] = [
  // Linda Lender's Items
  {
    id: 'item_l1',
    ownerId: 'user_lender',
    title: 'Professional Tile Cutter',
    description: 'Manual tile cutter for ceramic and porcelain tiles. Up to 24 inches.',
    type: ListingType.GOODS,
    category: 'Tools',
    imageUrl: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=300&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop'
    ],
    distanceMiles: 0.2,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 15,
    location: { x: 10, y: 10 }
  },
  {
    id: 'item_l2',
    ownerId: 'user_lender',
    title: 'Sourdough Baking Workshop',
    description: 'Spend an afternoon learning how to maintain a starter and bake rustic loaves.',
    type: ListingType.SKILL,
    category: 'Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
    gallery: [
       'https://images.unsplash.com/photo-1585476644321-b976d99988dc?w=400&h=300&fit=crop',
       'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=400&h=300&fit=crop'
    ],
    distanceMiles: 0.2,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 35,
    location: { x: 12, y: 8 }
  },
  // Existing Items
  {
    id: 'item_1',
    ownerId: 'user_2',
    title: 'DeWalt Cordless Drill',
    description: 'Heavy duty drill with 2 battery packs. Perfect for home repairs.',
    type: ListingType.GOODS,
    category: 'Tools',
    imageUrl: 'https://picsum.photos/id/250/400/300',
    gallery: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop'
    ],
    distanceMiles: 0.3,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 0,
    location: { x: 30, y: 50 }
  },
  {
    id: 'item_2',
    ownerId: 'user_2',
    title: 'French Gardening Tutor',
    description: 'I can help you plan your spring vegetable garden. Master Gardener certified.',
    type: ListingType.SKILL,
    category: 'Gardening',
    imageUrl: 'https://picsum.photos/id/292/400/300',
    gallery: [
      'https://images.unsplash.com/photo-1591857177580-dc82b9e4e1aa?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&h=300&fit=crop'
    ],
    distanceMiles: 0.3,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 25,
    location: { x: 30, y: 55 }
  },
  {
    id: 'item_3',
    ownerId: 'user_3',
    borrowerId: 'user_borrower', // Bob is borrowing this
    title: '8-Person Tent',
    description: 'Spacious camping tent. Easy to set up.',
    type: ListingType.GOODS,
    category: 'Outdoors',
    imageUrl: 'https://picsum.photos/id/445/400/300',
    gallery: [
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&h=300&fit=crop'
    ],
    distanceMiles: 0.8,
    status: AvailabilityStatus.BORROWED,
    hourlyRate: 12,
    location: { x: -20, y: 80 }
  },
  {
    id: 'item_4',
    ownerId: 'user_4',
    title: 'Pressure Washer',
    description: 'Electric pressure washer, 2000 PSI. Great for driveways.',
    type: ListingType.GOODS,
    category: 'Tools',
    imageUrl: 'https://picsum.photos/id/146/400/300',
    gallery: [
      'https://images.unsplash.com/photo-1605615732959-b1d62c5b7804?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1520111132644-8c08cb92994c?w=400&h=300&fit=crop'
    ],
    distanceMiles: 1.2,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 18,
    location: { x: 60, y: -20 }
  },
  {
    id: 'item_5',
    ownerId: 'user_3',
    title: 'Guitar Lessons (Beginner)',
    description: '30 minute sessions for acoustic guitar basics.',
    type: ListingType.SKILL,
    category: 'Music',
    imageUrl: 'https://picsum.photos/id/145/400/300',
    gallery: [
       'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop',
       'https://images.unsplash.com/photo-1549298240-0d8e60513026?w=400&h=300&fit=crop'
    ],
    distanceMiles: 0.8,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 40,
    location: { x: -20, y: 75 }
  },
  // NEW ITEMS FOR PAGINATION
  {
    id: 'item_6',
    ownerId: 'user_4',
    title: 'Extension Ladder',
    description: '24ft aluminum extension ladder. Very sturdy.',
    type: ListingType.GOODS,
    category: 'Tools',
    imageUrl: 'https://images.unsplash.com/photo-1582299887700-1c0953c3c72e?w=400&h=300&fit=crop',
    distanceMiles: 1.2,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 10,
    location: { x: 62, y: -22 }
  },
  {
    id: 'item_7',
    ownerId: 'user_1',
    title: 'DSLR Camera Kit',
    description: 'Canon DSLR with 2 lenses. Great for events.',
    type: ListingType.GOODS,
    category: 'Misc',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
    distanceMiles: 0.5,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 45,
    location: { x: 5, y: 5 }
  },
  {
    id: 'item_8',
    ownerId: 'user_1',
    title: 'Spanish Tutoring',
    description: 'Conversational Spanish lessons. I am a native speaker.',
    type: ListingType.SKILL,
    category: 'Misc',
    imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=300&fit=crop',
    distanceMiles: 0.5,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 25,
    location: { x: 6, y: 4 }
  },
  {
    id: 'item_9',
    ownerId: 'user_3',
    title: 'Portable BBQ Grill',
    description: 'Small propane grill, perfect for tailgating or camping.',
    type: ListingType.GOODS,
    category: 'Outdoors',
    imageUrl: 'https://images.unsplash.com/photo-1555037015-1498966f20ad?w=400&h=300&fit=crop',
    distanceMiles: 0.8,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 15,
    location: { x: -22, y: 78 }
  },
  {
    id: 'item_10',
    ownerId: 'user_2',
    title: 'Stand Mixer',
    description: 'Professional grade stand mixer for all your baking needs.',
    type: ListingType.GOODS,
    category: 'Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=400&h=300&fit=crop',
    distanceMiles: 0.3,
    status: AvailabilityStatus.AVAILABLE,
    hourlyRate: 20,
    location: { x: 32, y: 52 }
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'user_2',
    receiverId: 'user_borrower',
    content: 'Hi Bob! Welcome to the neighborhood. Let me know if you need anything.',
    timestamp: '2023-10-25T14:30:00Z',
    isRead: true
  },
  {
    id: 'm2',
    senderId: 'user_borrower',
    receiverId: 'user_2',
    content: 'Thanks Sarah! I might need to borrow a ladder soon.',
    timestamp: '2023-10-25T14:35:00Z',
    isRead: true
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    authorId: 'user_1',
    targetUserId: 'user_lender',
    listingId: 'item_l1',
    rating: 5,
    comment: 'Linda was super helpful showing me how to use the cutter. Great tool!',
    timestamp: '2023-09-15T10:00:00Z'
  },
  {
    id: 'r2',
    authorId: 'user_3',
    targetUserId: 'user_lender',
    listingId: 'item_l2',
    rating: 5,
    comment: 'The workshop was amazing. My bread actually tastes good now.',
    timestamp: '2023-08-20T14:00:00Z'
  },
  {
    id: 'r3',
    authorId: 'user_borrower',
    targetUserId: 'user_2',
    listingId: 'item_1',
    rating: 4,
    comment: 'Drill worked well, but battery life was a bit short. Sarah is very nice though.',
    timestamp: '2023-10-01T09:30:00Z'
  }
];
