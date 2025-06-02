/*
  # Fix profiles table RLS policies

  1. Changes
    - Add INSERT policy for profiles table to allow users to create their own profile
    - Ensure policy checks that user can only create profile with their own ID

  2. Security
    - Maintains existing RLS policies for SELECT and UPDATE
    - Adds new INSERT policy with proper auth checks
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);