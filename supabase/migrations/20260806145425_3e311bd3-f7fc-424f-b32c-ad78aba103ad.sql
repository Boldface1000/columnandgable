
CREATE POLICY "Members view blog images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'blog');
CREATE POLICY "Admins upload blog images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update blog images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blog' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete blog images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog' AND public.has_role(auth.uid(), 'admin'));
