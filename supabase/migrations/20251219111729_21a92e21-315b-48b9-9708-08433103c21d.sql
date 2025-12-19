-- Add Paddle-specific columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;

-- Create index for Paddle subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_subscription_id 
ON public.subscriptions(paddle_subscription_id);

-- Create index for Paddle customer lookups  
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_customer_id
ON public.subscriptions(paddle_customer_id);