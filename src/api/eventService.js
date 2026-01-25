export const fetchEvents = async () => {
  const res = await fetch('http://localhost:3001/events');
  const data = await res.json();
  return data;
};