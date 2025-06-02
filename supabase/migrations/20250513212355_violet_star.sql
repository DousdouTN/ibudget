/*
  # Add theme column to profiles table

  1. Changes
    - Add 'theme' column to profiles table with default value 'light'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme text DEFAULT 'light';
  END IF;
END $$;