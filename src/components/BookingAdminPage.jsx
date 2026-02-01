import { useEffect, useMemo, useState } from 'react';
import { fetchBookings, updateBooking } from '../api/bookingService';

const DEFAULT_ADMIN_PIN = '1234';

const getStoredPin = () => {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  try {
    return window.localStorage.getItem('moibook_booking_admin_pin') || DEFAULT_ADMIN_PIN;
  } catch (err) {
    return DEFAULT_ADMIN_PIN;
  }
};

const setStoredPin = (pin) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('moibook_booking_admin_pin', pin);
  } catch (err) {
    // ignore
  }
};

export default function BookingAdminPage() {
  const [pinInput, setPinInput] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinUpdate, setPinUpdate] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  const storedPin = useMemo(() => getStoredPin(), [isAuthed]);

  const loadBookings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchBookings({ status: statusFilter === 'all' ? '' : statusFilter });
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Bookings load failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed) {
      loadBookings();
    }
  }, [isAuthed, statusFilter]);

  const handleLogin = () => {
    if (pinInput.trim() === storedPin) {
      setIsAuthed(true);
      setPinInput('');
    } else {
      setError('PIN தவறானது');
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    setError('');
    try {
      await updateBooking(bookingId, { status });
      await loadBookings();
    } catch (err) {
      setError(err.message || 'Update failed');
    }
  };

  const handlePinChange = () => {
    if (!pinUpdate.trim()) {
      setPinMessage('புதிய PIN தேவை');
      return;
    }
    setStoredPin(pinUpdate.trim());
    setPinUpdate('');
    setPinMessage('PIN மாற்றப்பட்டது');
  };

  if (!isAuthed) {
    return (
      <div className="booking-page">
        <div className="booking-card">
          <h1>Admin Approval</h1>
          <p className="booking-subtitle">PIN மூலம் login செய்யவும்.</p>
          {error && <div className="booking-alert booking-error">{error}</div>}
          <label>
            Admin PIN
            <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
          </label>
          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-card booking-wide">
        <div className="booking-header-row">
          <h1>Booking Approvals</h1>
          <div className="booking-filter">
            <label>
              Filter
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>
        </div>

        <div className="booking-pin-row">
          <label>
            புதிய Admin PIN
            <input type="password" value={pinUpdate} onChange={(e) => setPinUpdate(e.target.value)} />
          </label>
          <button onClick={handlePinChange}>PIN மாற்று</button>
          {pinMessage && <span className="booking-note">{pinMessage}</span>}
        </div>

        {error && <div className="booking-alert booking-error">{error}</div>}
        {isLoading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <p>Bookings இல்லை</p>
        ) : (
          <div className="booking-table">
            <div className="booking-row booking-head">
              <span>பெயர்</span>
              <span>மொபைல்</span>
              <span>நாள்</span>
              <span>நேரம்</span>
              <span>நிகழ்ச்சி</span>
              <span>எண்ணிக்கை</span>
              <span>தொகை</span>
              <span>Payment Ref</span>
              <span>நிலை</span>
              <span>Action</span>
            </div>
            {bookings.map((booking) => (
              <div className="booking-row" key={booking.id}>
                <span>{booking.name}</span>
                <span>{booking.phone}</span>
                <span>{booking.date}</span>
                <span>{booking.time}</span>
                <span>{booking.eventName}</span>
                <span>{booking.invitationCount ?? '-'}</span>
                <span>₹{booking.amount ?? 0}</span>
                <span>{booking.paymentReference || '-'}</span>
                <span>{booking.status}</span>
                <span className="booking-actions">
                  <button onClick={() => handleStatusUpdate(booking.id, 'approved')}>Approve</button>
                  <button className="secondary" onClick={() => handleStatusUpdate(booking.id, 'rejected')}>Reject</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
