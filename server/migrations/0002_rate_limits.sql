CREATE TABLE rate_limits (
  device_id TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, window_start),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE INDEX idx_rate_limits_window
ON rate_limits(window_start);
