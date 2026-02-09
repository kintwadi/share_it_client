
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Listing, User, ListingType, AvailabilityStatus, Review } from '../types';
import { mockApi } from '../services/mockApi';
import { CheckoutForm } from '../components/CheckoutForm';
import { MapPin, ShieldCheck, ArrowLeft, MessageCircle, Calendar, CheckCircle2, AlertCircle, Loader2, Share2, BadgeCheck, Flag, DollarSign, Gift, ChevronLeft, ChevronRight, Star, X, Minus, Plus, Clock, CreditCard, Wallet, AlertTriangle, BellRing, Check, X as XIcon, Zap, ThumbsUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatPrice } = useLanguage();
  const [listing, setListing] = useState<Listing | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [wasAutoApproved, setWasAutoApproved] = useState(false);
  
  // Stripe State
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Booking Logic State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<'DURATION' | 'PAYMENT' | 'STRIPE_FORM'>('DURATION');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PAYPAL' | 'CASH'>('CARD');
  const [bookingDuration, setBookingDuration] = useState(2); // Default 2 hours

  // Reviews & Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [vouching, setVouching] = useState(false);
  const [hasVouched, setHasVouched] = useState(false);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [listingData, userData] = await Promise.all([
          mockApi.getListingById(id),
          mockApi.getCurrentUser()
        ]);
        setListing(listingData);
        if (listingData) {
          setActiveImage(listingData.imageUrl);
        }
        setCurrentUser(userData);
      } catch (e) {
        console.error("Error loading listing", e);
      } finally {
        setLoading(false);
      }
    };
    
    const initStripe = async () => {
      try {
        const { stripePublicKey } = await mockApi.getPublicConfig();
        setStripePromise(loadStripe(stripePublicKey));
      } catch (e) {
        console.error("Failed to load Stripe key", e);
      }
    };

    loadData();
    initStripe();
  }, [id]);

  const handleReport = async () => {
    if (!listing) return;
    setReporting(true);
    try {
      await mockApi.reportListing(listing.id, reportReason, reportDetails);
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
      setShowReportSuccess(true);
    } catch (e: any) {
      if (e.message && e.message.includes("already_reported_for_reason")) {
        setReportError('You have already reported this listing for this reason.');
      } else {
        setReportError('Failed to report listing. Please try again.');
      }
    } finally {
      setReporting(false);
    }
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
      // Call borrowItem with STRIPE and paymentIntentId
      setBorrowing(true); // Show loading
      try {
          await mockApi.borrowItem(listing!.id, {
            paymentMethod: 'STRIPE',
            paymentToken: paymentIntentId,
            durationHours: bookingDuration
          });
          
          setShowBookingModal(false);
          
          // Determine if it was an auto-approve to show correct success message
          if (listing?.autoApprove) {
             setWasAutoApproved(true);
             setListing(prev => prev ? ({ ...prev, status: AvailabilityStatus.BORROWED }) : null);
          } else {
             setWasAutoApproved(false);
             setListing(prev => prev ? ({ ...prev, status: AvailabilityStatus.PENDING }) : null);
          }
          
          setShowSuccess(true);
      } catch (e) {
          alert("Payment succeeded but booking failed. Please contact support.");
      } finally {
          setBorrowing(false);
      }
  };

  const handleInitialRequestClick = () => {
    if (!listing) return;
    
    // Require login to borrow
    if (!currentUser) {
        navigate('/connect');
        return;
    }

    if (listing.ownerId === currentUser.id) {
      alert("You cannot borrow your own item.");
      return;
    }
    // Open the configuration modal
    setBookingStep('DURATION');
    setPaymentMethod('CARD');
    setShowBookingModal(true);
  };

  const handleProceed = () => {
    setBookingStep('PAYMENT');
  };

  const handleConfirmRequest = async () => {
    if (!listing) return;
    
    setBorrowing(true);
    try {
      if (paymentMethod === 'CARD') {
         // New Stripe Flow
         try {
             const { clientSecret } = await mockApi.createPaymentIntent(finalTotal, 'usd', listing.id, bookingDuration);
             setClientSecret(clientSecret);
             setBookingStep('STRIPE_FORM');
         } catch (e) {
             console.error(e);
             alert("Failed to initialize payment. Please try again.");
         } finally {
             setBorrowing(false);
         }
         return; // Stop here, wait for Stripe form completion
      }

      // Existing logic for other methods
      let method = paymentMethod as string;
      // PAYPAL or CASH
      
      const token = 'mock_token';

      await mockApi.borrowItem(listing.id, {
        paymentMethod: method,
        paymentToken: token,
        durationHours: bookingDuration
      });

      setShowBookingModal(false);
      
      // Determine if it was an auto-approve to show correct success message
      if (listing.autoApprove) {
         setWasAutoApproved(true);
         // Optimistically update status to BORROWED
         setListing(prev => prev ? ({ ...prev, status: AvailabilityStatus.BORROWED }) : null);
      } else {
         setWasAutoApproved(false);
         // Optimistically update status to PENDING
         setListing(prev => prev ? ({ ...prev, status: AvailabilityStatus.PENDING }) : null);
      }
      
      setShowSuccess(true);
    } catch (e) {
      alert("Failed to process request. Please try again.");
    } finally {
      if (paymentMethod !== 'CARD') {
        setBorrowing(false);
      }
    }
  };

  const handleApprove = async () => {
    if (!listing) return;
    setActionLoading('APPROVE');
    try {
      await mockApi.approveRequest(listing.id);
      const updated = await mockApi.getListingById(listing.id);
      setListing(updated);
    } catch (e) {
      alert("Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async () => {
    if (!listing) return;
    setActionLoading('DENY');
    try {
      await mockApi.denyRequest(listing.id);
      const updated = await mockApi.getListingById(listing.id);
      setListing(updated);
    } catch (e) {
      alert("Failed to deny request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleContact = () => {
    // Require login to chat
    if (!currentUser) {
      navigate('/connect');
      return;
    }
    const targetId = listing?.ownerId || listing?.borrowerId;
    if (targetId) navigate(`/messages?userId=${targetId}`); else navigate('/messages');
  };

  const openUserProfile = async () => {
     if (!listing?.ownerId) return;
     setShowProfileModal(true);
     setLoadingReviews(true);
     try {
       const data = await mockApi.getReviews(listing.ownerId);
       setReviews(data);
     } finally {
       setLoadingReviews(false);
     }
  };

  const handleVouch = async () => {
      if (!listing?.ownerId || !currentUser) return;
      setVouching(true);
      try {
          const updatedUser = await mockApi.vouchForUser(listing.ownerId);
          // Update local listing state to reflect new user data
          setListing(prev => prev ? ({...prev, owner: updatedUser}) : null);
          setHasVouched(true);
      } catch (e) {
          alert('Failed to vouch');
      } finally {
          setVouching(false);
      }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;

  if (!listing) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-gray-900">Listing not found</h2>
      <Link to="/" className="text-brand-600 hover:text-brand-700 font-medium mt-4 inline-block">Return to Discovery</Link>
    </div>
  );

  const isOwner = currentUser?.id === listing.ownerId;
  const isAvailable = listing.status === AvailabilityStatus.AVAILABLE;
  const isPending = listing.status === AvailabilityStatus.PENDING;
  const isFree = !listing.hourlyRate || listing.hourlyRate === 0;
  const isAutoApprove = listing.autoApprove;

  const galleryImages = [listing.imageUrl, ...(listing.gallery || [])];
  
  const hourlyRate = listing.hourlyRate || 0;
  const totalCost = hourlyRate * bookingDuration;
  const serviceFee = isFree ? 0 : Math.round(totalCost * 0.05 * 100) / 100; // 5% mock fee
  const finalTotal = totalCost + serviceFee;

  const handleNextImage = () => {
    const currentIndex = galleryImages.indexOf(activeImage);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setActiveImage(galleryImages[nextIndex]);
  };

  const handlePrevImage = () => {
    const currentIndex = galleryImages.indexOf(activeImage);
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setActiveImage(galleryImages[prevIndex]);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="group flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors text-sm font-medium">
        <div className="bg-white border border-gray-200 rounded-full p-2 mr-3 group-hover:border-gray-400 transition-colors">
           <ArrowLeft size={16} />
        </div>
        Back to Listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Visuals (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-soft bg-white relative group select-none">
            <img 
              src={activeImage} 
              alt={listing.title} 
              className="w-full h-full object-cover transition-opacity duration-300" 
            />
            
            {/* Navigation Controls */}
            {galleryImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm hover:scale-105"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm hover:scale-105"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                   {galleryImages.indexOf(activeImage) + 1} / {galleryImages.length}
                </div>
              </>
            )}

            <div className="absolute top-6 left-6 flex flex-col gap-2 items-start pointer-events-none">
              <span className={`px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider shadow-lg backdrop-blur-md border border-white/20 text-white ${
                listing.type === ListingType.SKILL ? 'bg-indigo-500/90' : 'bg-teal-500/90'
              }`}>
                {listing.type === ListingType.SKILL ? 'Skill Exchange' : 'Item Borrow'}
              </span>

              {isFree && (
                <span className="px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider shadow-lg backdrop-blur-md border border-white/20 text-white bg-gradient-to-r from-pink-500 to-rose-500 flex items-center gap-2">
                  <Gift size={14} />
                  Community Special
                </span>
              )}
            </div>

            {isAutoApprove && (
               <div className="absolute top-6 right-6 flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md font-bold text-xs uppercase tracking-wide border border-white/20">
                  <Zap size={14} fill="currentColor" />
                  Instant Book
               </div>
            )}
          </div>
          
          {/* Gallery Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {galleryImages.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden transition-all duration-300 ${activeImage === img ? 'ring-2 ring-brand-500 ring-offset-2 scale-95 opacity-100' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-3">Description</h3>
             <p className="text-gray-600 leading-relaxed text-lg">
              {listing.description}
            </p>
          </div>
        </div>

        {/* Right Column: Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                 {listing.category}
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Share2 size={20} />
              </button>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{listing.title}</h1>

            {/* Price and Availability Block */}
             <div className="flex items-end justify-between border-b border-gray-100 pb-6 mb-6">
                <div>
                   <div className="flex items-center gap-1 text-gray-900 font-bold text-3xl">
                      {isFree ? (
                        <span className="text-pink-600 flex items-center gap-2">Free <span className="text-base text-gray-400 font-normal">/ {listing.type === ListingType.SKILL ? 'session' : 'use'}</span></span>
                      ) : (
                        <>
                          {formatPrice(listing.hourlyRate || 0)}<span className="text-sm text-gray-500 font-normal self-end mb-1">/hour</span>
                        </>
                      )}
                   </div>
                   <div className="text-xs text-gray-400 mt-1">Suggested Rate</div>
                </div>
                <div>
                   {isAvailable ? (
                    <span className="flex items-center text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                      Available
                    </span>
                  ) : isPending ? (
                     <span className="flex items-center text-indigo-600 text-sm font-bold bg-indigo-50 px-3 py-1.5 rounded-full">
                       <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
                       Request Pending
                     </span>
                  ) : (
                    <span className="flex items-center text-amber-600 text-sm font-bold bg-amber-50 px-3 py-1.5 rounded-full">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                      Unavailable
                    </span>
                  )}
                </div>
             </div>

            {/* Lender Compact Profile */}
            <div 
               onClick={openUserProfile}
               className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-8 cursor-pointer hover:bg-gray-100 transition-colors group"
            >
               <div className="flex items-center gap-3">
                 <div className="relative">
                   <img 
                     src={listing.owner?.avatarUrl || `https://picsum.photos/seed/${listing.owner?.id}/200/200`} 
                     alt={listing.owner?.name} 
                     onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${listing.owner?.id}/200/200`; }}
                     className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                   />
                   <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                     <BadgeCheck size={14} className="text-blue-500" />
                   </div>
                 </div>
                 <div>
                  <div className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{listing.owner?.name}</div>
                  <div className="text-xs text-gray-500">
                    Joined {listing.owner?.joinedDate && !isNaN(new Date(listing.owner.joinedDate).getTime()) 
                      ? new Date(listing.owner.joinedDate).getFullYear() 
                      : new Date().getFullYear()}
                  </div>
                </div>
               </div>
               <div className="text-right">
                  <div className="flex items-center text-emerald-600 font-bold text-sm justify-end">
                    <ShieldCheck size={16} className="mr-1" />
                    {listing.owner?.trustScore}%
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide group-hover:text-brand-500 transition-colors">View Profile</div>
               </div>
            </div>

            <div className="flex items-center text-sm text-gray-500 bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-8">
                <MapPin size={16} className="mr-2 text-blue-500" />
                <span>~{listing.distanceMiles} miles away (North Hills)</span>
             </div>

            {/* Action Buttons */}
            {showSuccess ? (
               <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center animate-fade-in">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  {wasAutoApproved ? (
                     <>
                        <h4 className="font-bold text-green-900 text-lg">Booking Confirmed!</h4>
                        <p className="text-green-800 text-sm mt-1 mb-4">This item has been instantly booked. You can coordinate pickup now.</p>
                     </>
                  ) : (
                     <>
                        <h4 className="font-bold text-green-900 text-lg">Request Sent!</h4>
                        <p className="text-green-800 text-sm mt-1 mb-4">The owner has received your request and will approve it shortly.</p>
                     </>
                  )}
                  
                  <button onClick={() => navigate('/dashboard')} className="text-sm font-bold text-green-700 underline hover:text-green-900">Go to Dashboard</button>
               </div>
             ) : (
               <div className="space-y-3">
                 {isOwner ? (
                    isPending ? (
                       <div className="w-full bg-white border border-brand-200 rounded-2xl p-5 shadow-sm animate-fade-in relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
                          <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-gray-900 flex items-center text-lg">
                                   <BellRing size={20} className="text-brand-600 mr-2 animate-pulse" />
                                   Pending Request
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  <span className="font-bold text-gray-900">{listing.borrower?.name}</span> wants to borrow this.
                                </p>
                              </div>
                              <div className="bg-brand-50 text-brand-700 font-bold text-xs px-2 py-1 rounded-lg border border-brand-100">
                                 {listing.borrower?.trustScore}% Trust
                              </div>
                          </div>
                          
                          <div className="flex gap-3">
                             <button 
                               onClick={handleApprove}
                               disabled={actionLoading === 'APPROVE'}
                               className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-colors shadow-lg shadow-gray-200"
                             >
                               {actionLoading === 'APPROVE' ? <Loader2 className="animate-spin mr-2" size={18} /> : <Check size={18} className="mr-2" />}
                               Approve
                             </button>
                             <button 
                               onClick={handleDeny}
                               disabled={actionLoading === 'DENY'}
                               className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-colors"
                             >
                               {actionLoading === 'DENY' ? <Loader2 className="animate-spin mr-2" size={18} /> : <XIcon size={18} className="mr-2" />}
                               Deny
                             </button>
                          </div>
                       </div>
                    ) : (
                      <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-bold text-center border-2 border-dashed border-gray-200">
                        You own this listing
                      </div>
                    )
                 ) : (
                   <>
                      {isPending ? (
                        <div className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-center border border-indigo-200 flex items-center justify-center">
                          <BellRing size={20} className="mr-2 animate-bounce" />
                          Request Awaiting Approval
                        </div>
                      ) : (
                        <button 
                          onClick={handleInitialRequestClick}
                          disabled={!isAvailable}
                          className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isAutoApprove ? (
                             <>
                                <Zap className="mr-2 text-amber-300" size={20} fill="currentColor" />
                                Instant Book
                             </>
                          ) : (
                             <>
                                <Calendar className="mr-2" size={20} />
                                {listing.type === ListingType.SKILL ? 'Request Session' : 'Request to Borrow'}
                             </>
                          )}
                        </button>
                      )}
                      
                      <button 
                        onClick={handleContact}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-all flex items-center justify-center hover:border-gray-300"
                      >
                        <MessageCircle className="mr-2" size={20} />
                        Chat with {listing.owner?.name.split(' ')[0]}
                      </button>
                   </>
                 )}
               </div>
             )}
             
             <div className="mt-6 flex justify-center">
               <button 
                 onClick={() => setShowReportModal(true)}
                 className="flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <Flag size={12} className="mr-1" />
                 Report this listing
               </button>
             </div>
          </div>
        </div>

      </div>

      {/* Booking Configuration Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-down">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-900 text-lg">
                    {bookingStep === 'DURATION' ? 'Request Details' : 'Checkout'}
                 </h3>
                 <button 
                   onClick={() => setShowBookingModal(false)} 
                   className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full border border-gray-200"
                 >
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6">
                
                {bookingStep === 'DURATION' && (
                  <>
                    <div className="flex gap-4 mb-6">
                      <img src={listing.imageUrl} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                      <div>
                          <h4 className="font-bold text-gray-900 line-clamp-1">{listing.title}</h4>
                          <p className="text-sm text-gray-500">{listing.category}</p>
                          <p className="text-xs text-brand-600 font-medium mt-1">
                            {isFree ? 'Free' : `${formatPrice(hourlyRate)}/hr`}
                          </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">How long do you need it?</label>
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <button 
                            onClick={() => setBookingDuration(Math.max(1, bookingDuration - 1))}
                            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:text-brand-600 border border-gray-200 hover:border-brand-200 transition-colors"
                            disabled={bookingDuration <= 1}
                          >
                            <Minus size={18} />
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="text-xl font-bold text-gray-900">{bookingDuration}</span>
                            <span className="text-xs text-gray-500 uppercase font-medium">Hours</span>
                          </div>
                          <button 
                            onClick={() => setBookingDuration(bookingDuration + 1)}
                            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:text-brand-600 border border-gray-200 hover:border-brand-200 transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                      </div>
                    </div>

                    {!isFree && (
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6 border border-gray-100">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{formatPrice(hourlyRate)} × {bookingDuration} hours</span>
                            <span>{formatPrice(totalCost)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Service Fee (5%)</span>
                            <span>{formatPrice(serviceFee)}</span>
                          </div>
                          <div className="h-px bg-gray-200 my-2"></div>
                          <div className="flex justify-between font-bold text-gray-900 text-lg">
                            <span>Total</span>
                            <span>{formatPrice(finalTotal)}</span>
                          </div>
                      </div>
                    )}

                    {isFree && (
                      <div className="bg-pink-50 text-pink-700 rounded-xl p-4 mb-6 flex items-center justify-center font-bold border border-pink-100">
                          <Gift size={20} className="mr-2" />
                          Total: {formatPrice(0)} (Free)
                      </div>
                    )}

                    <button 
                      onClick={isFree ? handleConfirmRequest : handleProceed}
                      className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                    >
                      {isFree 
                        ? (borrowing ? <Loader2 className="animate-spin" /> : (isAutoApprove ? 'Instant Book' : 'Confirm Request'))
                        : 'Proceed to Checkout'}
                    </button>
                  </>
                )}

                {bookingStep === 'PAYMENT' && (
                  <div className="animate-fade-in">
                    <button 
                      onClick={() => setBookingStep('DURATION')}
                      className="text-sm text-gray-500 hover:text-gray-800 flex items-center mb-4"
                    >
                      <ChevronLeft size={16} className="mr-1" /> Back
                    </button>

                    <div className="mb-6">
                      <div className="bg-brand-50 rounded-xl p-4 text-center border border-brand-100">
                        <p className="text-sm text-brand-800 font-medium">Total to Pay</p>
                        <p className="text-3xl font-bold text-brand-900">{formatPrice(finalTotal)}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Select Payment Method</label>
                      
                      <button 
                        onClick={() => setPaymentMethod('CARD')}
                        className={`w-full flex items-center p-3 rounded-xl border transition-all ${
                          paymentMethod === 'CARD' 
                          ? 'border-brand-500 bg-brand-50 text-brand-900' 
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="p-2 bg-white rounded-full border border-gray-200 mr-3">
                          <CreditCard size={20} className="text-gray-600" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-bold text-sm">Credit Card</div>
                          <div className="text-xs opacity-70">Pay securely via Stripe</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center ${paymentMethod === 'CARD' ? 'border-brand-600' : ''}`}>
                          {paymentMethod === 'CARD' && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                        </div>
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('PAYPAL')}
                        className={`w-full flex items-center p-3 rounded-xl border transition-all ${
                          paymentMethod === 'PAYPAL' 
                          ? 'border-brand-500 bg-brand-50 text-brand-900' 
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="p-2 bg-white rounded-full border border-gray-200 mr-3">
                          <Wallet size={20} className="text-blue-600" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-bold text-sm">PayPal</div>
                          <div className="text-xs opacity-70">Fast & easy checkout</div>
                        </div>
                         <div className={`w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center ${paymentMethod === 'PAYPAL' ? 'border-brand-600' : ''}`}>
                          {paymentMethod === 'PAYPAL' && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                        </div>
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('CASH')}
                        className={`w-full flex items-center p-3 rounded-xl border transition-all ${
                          paymentMethod === 'CASH' 
                          ? 'border-brand-500 bg-brand-50 text-brand-900' 
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="p-2 bg-white rounded-full border border-gray-200 mr-3">
                          <DollarSign size={20} className="text-green-600" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-bold text-sm">Cash in Person</div>
                          <div className="text-xs opacity-70">Pay when you meet</div>
                        </div>
                         <div className={`w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center ${paymentMethod === 'CASH' ? 'border-brand-600' : ''}`}>
                          {paymentMethod === 'CASH' && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                        </div>
                      </button>
                    </div>

                    {paymentMethod === 'CASH' && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-start">
                         <AlertTriangle className="text-amber-600 mr-3 flex-shrink-0" size={20} />
                         <div>
                           <p className="text-xs font-bold text-amber-800 mb-1">High Risk Option</p>
                           <p className="text-xs text-amber-700 leading-relaxed">
                             Cash transactions are not tracked by the platform. We cannot verify payment completion or offer refund protection for this method.
                           </p>
                         </div>
                      </div>
                    )}

                    <button 
                      onClick={handleConfirmRequest}
                      disabled={borrowing}
                      className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {borrowing ? <Loader2 className="animate-spin" /> : 'Confirm Payment'}
                    </button>
                  </div>
                )}

                {bookingStep === 'STRIPE_FORM' && (
                  <div className="animate-fade-in">
                    <button 
                      onClick={() => setBookingStep('PAYMENT')}
                      className="text-sm text-gray-500 hover:text-gray-800 flex items-center mb-4"
                    >
                      <ChevronLeft size={16} className="mr-1" /> Back to Payment Method
                    </button>
                    {stripePromise && clientSecret && (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm 
                          onSuccess={handleStripeSuccess}
                          onError={(error) => alert(error)}
                          amount={finalTotal}
                          currency="usd"
                        />
                      </Elements>
                    )}
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      {/* Profile & Reviews Modal */}
      {showProfileModal && listing.owner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-down max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-900 text-lg">Member Profile</h3>
                 <button 
                   onClick={() => setShowProfileModal(false)} 
                   className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full border border-gray-200"
                 >
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 <div className="flex items-center gap-4 mb-6">
                    <img 
                       src={listing.owner.avatarUrl || `https://picsum.photos/seed/${listing.owner.id}/200/200`} 
                       onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${listing.owner.id}/200/200`; }}
                       className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 shadow-sm" 
                    />
                    <div>
                       <h4 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          {listing.owner.name}
                          {listing.owner.verificationStatus === 'VERIFIED' && <BadgeCheck size={20} className="text-blue-500" />}
                       </h4>
                       <p className="text-sm text-gray-500">
                          Joined {listing.owner.joinedDate && !isNaN(new Date(listing.owner.joinedDate).getTime()) 
                             ? new Date(listing.owner.joinedDate).getFullYear() 
                             : new Date().getFullYear()}
                       </p>
                       <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                             <ShieldCheck size={14} className="mr-1 text-emerald-600" />
                             {listing.owner.trustScore}% Trust
                          </span>
                          <span className="flex items-center text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                             <ThumbsUp size={14} className="mr-1 text-brand-600" />
                             {listing.owner.vouchCount} Vouches
                          </span>
                       </div>
                    </div>
                 </div>

                 {!isOwner && currentUser && (
                    <button 
                       onClick={handleVouch}
                       disabled={vouching || hasVouched}
                       className="w-full py-3 mb-8 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl font-bold transition-colors flex items-center justify-center border border-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {vouching ? <Loader2 className="animate-spin" /> : (hasVouched ? 'Vouched!' : 'Vouch for this User')}
                    </button>
                 )}

                 <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star size={18} className="text-yellow-400 fill-current" />
                    Reviews ({reviews.length})
                 </h4>
                 
                 {loadingReviews ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
                 ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                       {reviews.map((review) => (
                          <div key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                             <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-1 text-yellow-500">
                                   {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                   ))}
                                </div>
                                <span className="text-xs text-gray-400">{new Date(review.timestamp).toLocaleDateString()}</span>
                             </div>
                             <p className="text-gray-700 text-sm italic">"{review.comment}"</p>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                       No reviews yet.
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-down">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Flag size={20} className="text-red-500" />
                    Report Listing
                 </h3>
                 <button 
                   onClick={() => setShowReportModal(false)} 
                   className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full border border-gray-200"
                 >
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6">
                 <p className="text-sm text-gray-500 mb-4">
                    Please provide details about why you are reporting this listing. Our team will review your report.
                 </p>
                 
                 <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Reason</label>
                    <select 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    >
                       <option value="">Select a reason</option>
                       <option value="inappropriate">Inappropriate Content</option>
                       <option value="scam">Scam / Fraud</option>
                       <option value="misleading">Misleading Information</option>
                       <option value="other">Other</option>
                    </select>
                 </div>
                 
                 <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Additional Details</label>
                    <textarea 
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Please describe the issue..."
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all min-h-[100px]"
                    />
                 </div>
                 
                 <div className="flex gap-3">
                    <button 
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                    >
                       Cancel
                    </button>
                    <button 
                      onClick={handleReport}
                      disabled={!reportReason || reporting}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {reporting ? <Loader2 className="animate-spin" /> : 'Submit Report'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Report Success Modal */}
      {showReportSuccess && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-down text-center p-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-2">Report Submitted</h3>
              <p className="text-gray-500 mb-6">
                 Thank you for helping keep our community safe. Our team will review your report shortly.
              </p>
              <button 
                onClick={() => setShowReportSuccess(false)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-colors"
              >
                 Close
              </button>
           </div>
        </div>
      )}

      {/* Report Error Modal */}
      {reportError && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-down text-center p-8">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-2">Report Failed</h3>
              <p className="text-gray-500 mb-6">
                 {reportError}
              </p>
              <button 
                onClick={() => setReportError(null)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-colors"
              >
                 Close
              </button>
           </div>
        </div>
      )}

    </div>
  );
};
