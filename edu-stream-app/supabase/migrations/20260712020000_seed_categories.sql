-- Seed a starter set of course/playlist categories.
insert into public.category (name, slug) values
  ('Web Development', 'web-development'),
  ('Data Science', 'data-science'),
  ('Design', 'design'),
  ('Business', 'business'),
  ('Marketing', 'marketing'),
  ('Personal Development', 'personal-development'),
  ('Language Learning', 'language-learning'),
  ('Mathematics', 'mathematics'),
  ('Science', 'science'),
  ('Music', 'music')
on conflict (name) do nothing;
