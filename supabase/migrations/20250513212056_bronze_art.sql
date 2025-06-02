/*
  # Add theme column to profiles table

  1. Changes
    - Add theme column to profiles table with default value 'light'
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light';