-- Migration: 004_enhance_prediction_history
-- Description: Enhance prediction_history table to support win/loss tracking

-- Add new columns to prediction_history table
ALTER TABLE prediction_history
ADD COLUMN IF NOT EXISTS lotto_type TEXT,
ADD COLUMN IF NOT EXISTS target_draw_date DATE,
ADD COLUMN IF NOT EXISTS predicted_numbers INTEGER[],
ADD COLUMN IF NOT EXISTS actual_draw_id UUID REFERENCES draws(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS matches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prediction_history_lotto_type ON prediction_history(lotto_type);
CREATE INDEX IF NOT EXISTS idx_prediction_history_target_date ON prediction_history(target_draw_date);
CREATE INDEX IF NOT EXISTS idx_prediction_history_is_checked ON prediction_history(is_checked);

-- Function to check predictions against actual draws
CREATE OR REPLACE FUNCTION check_prediction_against_draw(
    p_prediction_id UUID,
    p_draw_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_predicted_numbers INTEGER[];
    v_actual_numbers INTEGER[];
    v_matches INTEGER;
BEGIN
    -- Get predicted numbers
    SELECT predicted_numbers INTO v_predicted_numbers
    FROM prediction_history
    WHERE id = p_prediction_id;
    
    -- Get actual winning numbers
    SELECT winning_numbers INTO v_actual_numbers
    FROM draws
    WHERE id = p_draw_id;
    
    -- Calculate matches (intersection)
    SELECT COUNT(*) INTO v_matches
    FROM unnest(v_predicted_numbers) AS pred_num
    WHERE pred_num = ANY(v_actual_numbers);
    
    -- Update prediction history
    UPDATE prediction_history
    SET 
        actual_draw_id = p_draw_id,
        matches = v_matches,
        is_checked = TRUE,
        checked_at = NOW()
    WHERE id = p_prediction_id;
    
    RETURN v_matches;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-check predictions when new draw is added
CREATE OR REPLACE FUNCTION auto_check_predictions()
RETURNS TRIGGER AS $$
BEGIN
    -- Check all unchecked predictions for this lotto type and date
    UPDATE prediction_history ph
    SET 
        actual_draw_id = NEW.id,
        matches = (
            SELECT COUNT(*)
            FROM unnest(ph.predicted_numbers) AS pred_num
            WHERE pred_num = ANY(NEW.winning_numbers)
        ),
        is_checked = TRUE,
        checked_at = NOW()
    WHERE ph.lotto_type = NEW.lotto_type
      AND ph.target_draw_date = NEW.draw_date
      AND ph.is_checked = FALSE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-check predictions
DROP TRIGGER IF EXISTS trigger_auto_check_predictions ON draws;
CREATE TRIGGER trigger_auto_check_predictions
    AFTER INSERT ON draws
    FOR EACH ROW
    EXECUTE FUNCTION auto_check_predictions();

