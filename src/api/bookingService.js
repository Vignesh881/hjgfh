const resolveApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001/api';
  const globalUrl = typeof window.__MOIBOOK_API_URL__ === 'string' ? window.__MOIBOOK_API_URL__ : '';
  if (globalUrl && globalUrl.trim()) return globalUrl.replace(/\/+$/, '');
  try {
    const stored = window.localStorage?.getItem?.('moibook_api_url');
    if (stored && stored.trim()) return stored.replace(/\/+$/, '');
  } catch (err) {
    // ignore
  }
  return 'http://localhost:3001/api';
};

const getApiUrl = (path) => {
  const base = resolveApiBaseUrl();
  const sanitized = base.endsWith('/api') ? base : `${base}/api`;
  return `${sanitized}${path}`;
};

export const createBooking = async (payload) => {
  const response = await fetch(getApiUrl('/bookings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Booking creation failed');
  }

  return response.json();
};

export const fetchBookings = async ({ status, phone } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (phone) params.set('phone', phone);
  const query = params.toString();
  const response = await fetch(getApiUrl(`/bookings${query ? `?${query}` : ''}`));

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to load bookings');
  }

  return response.json();
};

export const updateBooking = async (id, updates) => {
  const response = await fetch(getApiUrl(`/bookings/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Booking update failed');
  }

  return response.json();
};
