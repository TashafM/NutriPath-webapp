-- Plans shown on the website and edited from /admin > Plans.
-- Run once in Supabase SQL Editor (after supabase.sql).
create table plans (
  id bigint generated always as identity primary key,
  title text not null unique, -- orders store this title, so keep it unique
  tag text,
  description text,
  features text[] not null default '{}',
  amount integer not null check (amount > 0), -- INR, the price actually charged
  original_amount integer check (original_amount is null or original_amount > amount), -- shown crossed out
  period text not null default 'month' check (period in ('month', 'session')),
  image text, -- starred (top) plans show this photo
  image_alt text,
  icon text, -- "More programs" cards show this icon
  featured boolean not null default false, -- max 4, enforced by the admin API
  popular boolean not null default false,
  published boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

-- Anyone can read published plans; only the server (service role key) can write.
alter table plans enable row level security;
create policy "Anyone reads published plans" on plans for select to anon, authenticated using (published);

insert into plans (title, tag, description, features, amount, period, image, image_alt, icon, featured, popular, sort) values
  ('Weight Loss Program', 'SUSTAINABLE FAT LOSS', 'Calorie-smart, personalised plans to help you lose fat steadily, without crash diets.', array['Calorie deficit plans', 'Fat loss focus', 'Meal & workout guidance', 'Weekly follow-ups'], 2999, 'month', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80', 'Colourful bowl of avocado, chickpeas, tomatoes and fresh vegetables', null, true, true, 10),
  ('Weight Gain Program', 'NOURISH & BUILD', 'Structured plans to help you gain healthy weight and build strength with wholesome food.', array['Healthy weight gain', 'Muscle building plans', 'Protein rich meals', 'Strength improvement'], 2699, 'month', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=700&q=80', 'Berry smoothies in glasses', null, true, false, 20),
  ('PCOS Management', 'HORMONE BALANCE', 'Targeted nutrition to manage PCOS symptoms, balance hormones and feel better every day.', array['Hormone balance', 'PCOS friendly diet', 'Lifestyle guidance', 'Stress management'], 3799, 'month', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=700&q=80', 'Yogurt parfaits topped with fresh strawberries', null, true, false, 30),
  ('Thyroid Care Program', 'ENERGY & METABOLISM', 'Thyroid-friendly eating that supports your metabolism, energy levels and weight.', array['Thyroid friendly diet', 'Weight management', 'Energy boost', 'Lifestyle guidance'], 3499, 'month', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80', 'Salad bowl with salmon, vegetables and greens', null, true, false, 40),
  ('Diabetes Care Program', null, 'Steady blood sugar through balanced, low-GI meals you can actually enjoy.', array['Blood sugar control', 'Low GI meal plans', 'Carb management', 'Lifestyle support'], 3899, 'month', null, null, 'Droplet', false, false, 50),
  ('Pregnancy Nutrition', null, 'Trimester-wise nutrition for a healthy you and a healthy baby.', array['Trimester-wise plans', 'Mother & baby health', 'Nutrient rich meals', 'Expert guidance'], 3999, 'month', null, null, 'Baby', false, false, 60),
  ('Postpartum Recovery', null, 'Gentle nutrition to help you heal, feed your baby and get your energy back.', array['Healing nutrition', 'Lactation support', 'Energy restoration', 'Weight management'], 3199, 'month', null, null, 'HeartHandshake', false, false, 70),
  ('Hijama Wellness Consultation', null, 'Guidance on hijama with diet and lifestyle support before and after.', array['Hijama guidance', 'Pre & post care', 'Diet & lifestyle support', 'Personalised advice'], 1499, 'session', null, null, 'HandHeart', false, false, 80),
  ('Prophetic Medicine Consultation', null, 'Sunnah-based guidance on natural healing and everyday wellbeing.', array['Sunnah-based guidance', 'Natural healing', 'Dietary recommendations', 'Holistic wellbeing'], 2199, 'session', null, null, 'Sparkles', false, false, 90);
