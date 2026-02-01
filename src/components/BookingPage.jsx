import { useState } from 'react';
import { createBooking } from '../api/bookingService';

const initialForm = {
  name: '',
  phone: '',
  date: '',
  time: '',
  eventName: '',
  invitationCount: '',
  amount: '',
  paymentReference: ''
};

export default function BookingPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'பெயர் தேவை.';
    if (!form.phone.trim()) return 'மொபைல் எண் தேவை.';
    if (!form.date) return 'நாள் தேர்வு செய்யவும்.';
    if (!form.time) return 'நேரம் தேர்வு செய்யவும்.';
    if (!form.eventName.trim()) return 'நிகழ்ச்சி பெயர் தேவை.';
    if (!form.invitationCount) return 'பத்திரிக்கை எண்ணிக்கை தேவை.';
    if (!form.amount) return 'தொகை தேவை.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        eventName: form.eventName.trim(),
        invitationCount: parseInt(form.invitationCount, 10),
        amount: parseFloat(form.amount),
        paymentMethod: 'online',
        paymentReference: form.paymentReference.trim() || null
      };

      const result = await createBooking(payload);
      setSuccess(result);
      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'Booking சேர்க்க முடியவில்லை.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-card">
        <h1>மொய்புக் Booking</h1>
        <p className="booking-subtitle">நிகழ்ச்சி booking பதிவு செய்யவும். Admin approve செய்த பின் தகவல் உறுதி செய்யப்படும்.</p>

        {error && <div className="booking-alert booking-error">{error}</div>}
        {success && (
          <div className="booking-alert booking-success">
            உங்கள் booking பதிவு செய்யப்பட்டது. Booking ID: <strong>{success.id}</strong>
            <br />நிலை: {success.status || 'pending'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="booking-form">
          <label>
            பெயர்
            <input type="text" value={form.name} onChange={handleChange('name')} />
          </label>

          <label>
            மொபைல் எண்
            <input type="tel" value={form.phone} onChange={handleChange('phone')} />
          </label>

          <label>
            நாள்
            <input type="date" value={form.date} onChange={handleChange('date')} />
          </label>

          <label>
            நேரம்
            <input type="time" value={form.time} onChange={handleChange('time')} />
          </label>

          <label>
            நிகழ்ச்சி பெயர்
            <input type="text" value={form.eventName} onChange={handleChange('eventName')} />
          </label>

          <label>
            பத்திரிக்கை எண்ணிக்கை
            <input type="number" min="0" value={form.invitationCount} onChange={handleChange('invitationCount')} />
          </label>

          <label>
            தொகை (₹)
            <input type="number" min="0" step="0.01" value={form.amount} onChange={handleChange('amount')} />
          </label>

          <label>
            Online Payment Ref (UPI/Txn ID)
            <input type="text" value={form.paymentReference} onChange={handleChange('paymentReference')} placeholder="optional" />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'பதிவு செய்கிறது...' : 'Booking பதிவு செய்க'}
          </button>
        </form>
      </div>
    </div>
  );
}
