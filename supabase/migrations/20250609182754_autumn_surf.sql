/*
  # Create categories table for persistent category storage

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `color` (text)
      - `icon` (text)
      - `type` (text, either 'expense' or 'income')
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own categories

  3. Data Migration
    - Insert default categories for existing users
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#9CA3AF',
  icon text NOT NULL DEFAULT 'tag',
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own categories"
  ON categories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default expense categories
  INSERT INTO categories (user_id, name, color, icon, type) VALUES
    (p_user_id, 'Dépenses Quotidiennes', '#F87171', 'coffee', 'expense'),
    (p_user_id, 'Transport', '#FBBF24', 'car', 'expense'),
    (p_user_id, 'Loisirs & Divertissement', '#818CF8', 'tv', 'expense'),
    (p_user_id, 'Courses', '#34D399', 'shopping-basket', 'expense'),
    (p_user_id, 'Maison & Services', '#60A5FA', 'home', 'expense'),
    (p_user_id, 'Santé & Bien-être', '#F472B6', 'heart-pulse', 'expense'),
    (p_user_id, 'Voyages & Vacances', '#A78BFA', 'plane', 'expense'),
    (p_user_id, 'Éducation', '#6EE7B7', 'book', 'expense'),
    (p_user_id, 'Épargne', '#059669', 'piggy-bank', 'expense'),
    (p_user_id, 'Autres Dépenses', '#9CA3AF', 'more-horizontal', 'expense')
  ON CONFLICT (user_id, name, type) DO NOTHING;

  -- Insert default income categories
  INSERT INTO categories (user_id, name, color, icon, type) VALUES
    (p_user_id, 'Salaire', '#10B981', 'briefcase', 'income'),
    (p_user_id, 'Freelance', '#3B82F6', 'laptop', 'income'),
    (p_user_id, 'Investissements', '#8B5CF6', 'trending-up', 'income'),
    (p_user_id, 'Cadeaux', '#EC4899', 'gift', 'income'),
    (p_user_id, 'Remboursements', '#F59E0B', 'rotate-ccw', 'income'),
    (p_user_id, 'Autres Revenus', '#6B7280', 'plus-circle', 'income')
  ON CONFLICT (user_id, name, type) DO NOTHING;
END;
$$;

-- Update the handle_new_user function to create default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Create default categories for the new user
  PERFORM create_default_categories(new.id);
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error (Supabase will capture this in the logs)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;

-- Create default categories for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM profiles LOOP
    PERFORM create_default_categories(user_record.id);
  END LOOP;
END $$;