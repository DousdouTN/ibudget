-- Create function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress(p_goal_id uuid, p_amount decimal)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE goals
  SET 
    current_amount = LEAST(current_amount + p_amount, target_amount),
    updated_at = now()
  WHERE id = p_goal_id;
END;
$$;