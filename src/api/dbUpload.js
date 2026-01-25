export const uploadDBFile = async (file) => {
  const formData = new FormData();
  formData.append('dbfile', file);

  await fetch('http://localhost:3001/upload-db', {
    method: 'POST',
    body: formData,
  });
};