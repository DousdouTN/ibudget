/*
  # Add goals table for tracking financial goals

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text, either 'savings' or 'expense_reduction')
      - `target_amount` (decimal)
      - `current_amount` (decimal)
      - `start_date` (date)
      - `end_date` (date)
      - `category` (text, optional)
      - `title` (text)
      - `description` (text)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - Read their own goals
      - Create and update their own goals
*/

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('savings', 'expense_reduction')),
  target_amount decimal(12,2) NOT NULL,
  current_amount decimal(12,2) NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  category text,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own goals"
  ON goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals
  FOR DELETE
  USING (auth.uid() = user_id);