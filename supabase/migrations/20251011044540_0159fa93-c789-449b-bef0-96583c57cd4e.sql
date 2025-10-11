-- Add structured_data column to blog_posts table for AI-search optimization
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS structured_data JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN blog_posts.structured_data IS 'Stores AI-search optimized data: quick_answer (string), faq (array of {question, answer}), how_to_steps (array of {step_number, name, description})';