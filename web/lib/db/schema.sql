-- TourLayer Database Schema

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  api_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tours table
CREATE TABLE tours (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url_pattern VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tour Steps table
CREATE TABLE tour_steps (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  selector VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  button_text VARCHAR(100) DEFAULT 'Next',
  placement VARCHAR(20) DEFAULT 'bottom',
  pulse_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE tour_analytics (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id) ON DELETE CASCADE,
  step_id INTEGER REFERENCES tour_steps(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'started', 'completed', 'skipped'
  user_identifier VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_tours_user_id ON tours(user_id);
CREATE INDEX idx_tour_steps_tour_id ON tour_steps(tour_id);
CREATE INDEX idx_analytics_tour_id ON tour_analytics(tour_id);
CREATE INDEX idx_users_api_token ON users(api_token);

