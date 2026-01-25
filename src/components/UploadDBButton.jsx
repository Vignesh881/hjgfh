import React, { useState } from 'react';
import { uploadDBFile } from '../api/dbUpload';

export default function UploadDBButton() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (file) {
      await uploadDBFile(file);
      alert('Database uploaded successfully!');
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload MoiBook DB</button>
    </div>
  );
}