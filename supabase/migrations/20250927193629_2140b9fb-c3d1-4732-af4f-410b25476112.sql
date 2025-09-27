-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a daily cron job to sync transactions
-- This runs every day at 2:00 AM UTC
SELECT cron.schedule(
  'daily-transaction-sync',
  '0 2 * * *', -- Daily at 2:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    body := jsonb_build_object('autoSync', true)
  ) AS request_id;
  $$
);

-- Also create an hourly job for more frequent updates during business hours (9 AM - 6 PM UTC)
SELECT cron.schedule(
  'hourly-transaction-sync-business-hours',
  '0 9-18 * * 1-5', -- Every hour from 9 AM to 6 PM UTC on weekdays
  $$
  SELECT net.http_post(
    url := 'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    body := jsonb_build_object('autoSync', true)
  ) AS request_id;
  $$
);

-- Add a column to track last sync time for reports
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_report_sync timestamp with time zone DEFAULT now();