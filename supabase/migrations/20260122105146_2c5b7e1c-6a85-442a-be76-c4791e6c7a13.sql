-- Remove legacy LemonSqueezy columns from subscriptions table
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS lemon_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS lemon_customer_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS lemon_order_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS variant_id;