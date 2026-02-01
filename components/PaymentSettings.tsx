import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { mockApi } from '../services/mockApi';
import { Loader2, CreditCard, Trash2, Plus } from 'lucide-react';

// Payment Form Component
const AddCardForm = ({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message || 'An error occurred');
      setProcessing(false);
    } else {
      try {
        await mockApi.addPaymentMethod(paymentMethod.id);
        onSuccess();
      } catch (err) {
        setError('Failed to save payment method');
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl bg-gray-50">
      <div className="p-3 bg-white border rounded-lg">
        <CardElement options={{
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#9e2146',
                },
            },
        }} />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
        >
          {processing && <Loader2 className="animate-spin" size={16} />}
          Save Card
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// Main Payment Settings Component
export const PaymentSettings = () => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const config = await mockApi.getPublicConfig();
        if (config.stripePublicKey) {
          setStripePromise(loadStripe(config.stripePublicKey));
        }
        await loadPaymentMethods();
      } catch (e) {
        console.error("Failed to load payment settings", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const methods = await mockApi.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (e) {
      console.error("Failed to load payment methods", e);
    }
  };

  const handleSuccess = async () => {
    setShowAddForm(false);
    await loadPaymentMethods();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Payment Methods</h3>
        {!showAddForm && stripePromise && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700"
          >
            <Plus size={18} /> Add New Card
          </button>
        )}
      </div>

      {showAddForm && stripePromise && (
        <Elements stripe={stripePromise}>
          <AddCardForm onSuccess={handleSuccess} onCancel={() => setShowAddForm(false)} />
        </Elements>
      )}

      <div className="space-y-3">
        {paymentMethods.length === 0 && !showAddForm ? (
          <p className="text-gray-500 text-center py-8">No payment methods saved.</p>
        ) : (
          paymentMethods.map((pm: any) => (
            <div key={pm.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-brand-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CreditCard className="text-gray-600" size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 capitalize">{pm.brand} •••• {pm.last4}</p>
                  <p className="text-sm text-gray-500">Expires {pm.expMonth}/{pm.expYear}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
