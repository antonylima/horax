CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  tags TEXT[],
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notified BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS weekly_patterns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_patterns_weekday ON weekly_patterns(weekday);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
