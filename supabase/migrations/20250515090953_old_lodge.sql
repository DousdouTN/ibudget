/*
  # Add recurring transactions support

  1. Changes
    - Add `is_recurring` boolean column to transactions table
    - Add `recurrence_interval` text column to store monthly/weekly/etc
    - Add `next_due_date` date column for tracking next occurrence
    - Add `last_generated_date` date column to track last auto-generation
*/

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_interval text CHECK (recurrence_interval IN ('monthly', 'weekly', 'yearly')),
ADD COLUMN IF NOT EXISTS next_due_date date,
ADD COLUMN IF NOT EXISTS last_generated_date date;

-- Create function to generate recurring transactions
CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec record;
BEGIN
    FOR rec IN 
        SELECT * FROM transactions 
        WHERE is_recurring = true 
        AND next_due_date <= CURRENT_DATE
        AND (last_generated_date IS NULL OR last_generated_date < next_due_date)
    LOOP
        -- Insert new transaction
        INSERT INTO transactions (
            user_id,
            date,
            amount,
            description,
            category,
            type,
            is_recurring,
            recurrence_interval,
            next_due_date,
            last_generated_date
        ) VALUES (
            rec.user_id,
            rec.next_due_date,
            rec.amount,
            rec.description,
            rec.category,
            rec.type,
            false, -- New transaction is not recurring
            NULL,  -- Clear recurrence fields
            NULL,
            NULL
        );

        -- Update next due date and last generated date
        UPDATE transactions
        SET 
            next_due_date = CASE 
                WHEN recurrence_interval = 'monthly' THEN next_due_date + INTERVAL '1 month'
                WHEN recurrence_interval = 'weekly' THEN next_due_date + INTERVAL '1 week'
                WHEN recurrence_interval = 'yearly' THEN next_due_date + INTERVAL '1 year'
            END,
            last_generated_date = CURRENT_DATE
        WHERE id = rec.id;
    END LOOP;
END;
$$;