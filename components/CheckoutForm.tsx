import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface CheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  amount: number;
  currency: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess, onError, amount, currency }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required', // Avoid redirect if not necessary (e.g. card doesn't require 3DS)
        confirmParams: {
          return_url: window.location.origin + '/dashboard', // Fallback for 3DS
        },
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || "An unexpected error occurred.");
        } else {
          setMessage("An unexpected error occurred.");
        }
        onError(error.message || "Payment failed");
        setIsLoading(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage("Payment succeeded!");
        onSuccess(paymentIntent.id);
        // Don't set loading to false immediately, let the parent handle the transition
      } else {
        // This handles cases where status is 'processing' or 'requires_action' if redirect didn't happen
        setMessage("Payment processing...");
        setIsLoading(false);
      }
    } catch (e: any) {
      setMessage("An unexpected error occurred.");
      onError(e.message || "Payment failed");
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      </div>
      
      {message && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in">
          <AlertCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      <div className="flex items-center justify-center text-xs text-gray-500 mb-4">
         <ShieldCheck size={14} className="mr-1 text-green-600" />
         Payments processed securely by Stripe
      </div>

      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
             <Loader2 className="animate-spin" />
             <span>Processing...</span>
          </div>
        ) : (
          `Pay`
        )}
      </button>
    </form>
  );
};
