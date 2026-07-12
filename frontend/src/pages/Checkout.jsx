import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import { PageHead, EmptyState, money } from '../components';
import { useCart, useAuth, useToast } from '../context';
import { api } from '../api';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_63f25ab088b3520ab27ec7643fa69f44d87d4d22';

function makeReference() {
  return `GOS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, refresh } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [payment, setPayment] = useState('Mobile Money');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const reference = React.useMemo(() => makeReference(), []);

  if (!items.length) {
    return (
      <>
        <div className="page-head"><h1>Checkout</h1></div>
        <EmptyState emoji="🛒" title="Nothing to check out" sub="Add items to your cart first." />
      </>
    );
  }

  const shipping = 3.99;
  const total = subtotal + shipping;

  const paystackConfig = {
    reference,
    email: user?.email || 'guest@example.com',
    amount: Math.round(total * 100),
    currency: 'GHS',
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      custom_fields: [
        { display_name: 'Customer', variable_name: 'customer_name', value: user?.name || 'Customer' },
        { display_name: 'Phone', variable_name: 'phone', value: phone || '' },
      ],
    },
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const finishOrder = async (verifyPayload) => {
    setPlacing(true);
    setError('');
    try {
      await api.verifyPayment(verifyPayload);
      await refresh();
      toast && toast('Payment confirmed — order placed!');
      navigate('/orders');
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  const placeOrder = async () => {
    setError('');
    if (!address.trim()) { setError('Add a delivery address'); return; }

    if (payment === 'Cash on Delivery') {
      setPlacing(true);
      try {
        await api.checkout({ address, phone, payment_method: payment });
        await refresh();
        toast && toast('Order placed successfully!');
        navigate('/orders');
      } catch (e) {
        setError(e.message);
      } finally {
        setPlacing(false);
      }
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY) {
      setError('Payment provider is not configured yet — add VITE_PAYSTACK_PUBLIC_KEY to frontend/.env');
      return;
    }

    initializePayment({
      onSuccess: async (response) => {
        await finishOrder({
          reference: response.reference,
          address, phone, payment_method: payment,
        });
      },
      onClose: () => {},
    });
  };

  const options = [
    { id: 'Mobile Money', ic: '📱', label: 'Mobile Money', sub: 'MTN, Airtel, M-Pesa & more' },
    { id: 'Card', ic: '💳', label: 'Debit / Credit Card', sub: 'Visa, Mastercard' },
    { id: 'Cash on Delivery', ic: '💵', label: 'Cash on Delivery', sub: 'Pay when it arrives' },
  ];

  return (
    <>
      <PageHead title="Checkout" onBack={() => navigate('/cart')} />
      <div className="section"><div className="section-head"><h2>Delivery Address</h2></div></div>
      <div style={{ padding: '0 16px' }}>
        <div className="field"><label>Full name</label><input value={user?.name || ''} readOnly /></div>
        <div className="field"><label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Market Street, Lagos" />
        </div>
        <div className="field"><label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" />
        </div>
        {error && <div className="field-error">{error}</div>}
      </div>

      <div className="section"><div className="section-head"><h2>Payment Method</h2></div></div>
      <div style={{ padding: '0 16px' }}>
        {options.map((o) => (
          <div key={o.id} className={`pay-option ${payment === o.id ? 'selected' : ''}`} onClick={() => setPayment(o.id)}>
            <span className="ic">{o.ic}</span>
            <div><div className="lbl">{o.label}</div><div className="sub">{o.sub}</div></div>
          </div>
        ))}
        {payment !== 'Cash on Delivery' && (
          <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '4px 0 0' }}>
            You'll be taken to a secure Paystack payment popup to complete this.
          </p>
        )}
      </div>

      <div className="summary-box">
        <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="summary-row"><span>Delivery</span><span>{money(shipping)}</span></div>
        <div className="summary-row total"><span>Total</span><span>{money(total)}</span></div>
      </div>
      <div className="sticky-bottom">
        <button className="amber-btn" disabled={placing} onClick={placeOrder}>
          {placing ? 'Processing…' : payment === 'Cash on Delivery' ? `Place Order · ${money(total)}` : `Pay ${money(total)}`}
        </button>
      </div>
    </>
  );
}