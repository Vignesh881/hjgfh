CREATE TABLE moi_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT,
  contributor_name VARCHAR(255),
  amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
