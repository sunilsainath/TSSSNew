-- ---------------------------------------------------------------------------
-- 0007_blog_created_by.sql
--
-- `adminSaveAction` stamps `created_by` whenever a blog is created from the
-- panel, but the column was never added to `blogs`. Every insert therefore
-- failed with "Could not find the 'created_by' column", which is the Admin
-- Error reported when adding a blog post. Events and media items worked
-- because their tables already had the column.
-- ---------------------------------------------------------------------------

alter table public.blogs add column if not exists created_by uuid;

comment on column public.blogs.created_by is
  'The administrator who created the post from the panel, if any.';
