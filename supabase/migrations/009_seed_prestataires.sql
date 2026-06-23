-- Seed: 10 fake prestataires for UI testing (removed at start of 1C)
-- Inserting into auth.users triggers handle_new_user() which creates profiles rows automatically.

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.karim.benali@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.yacine.mammeri@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.rachid.bensalem@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.sofiane.boudiaf@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.hamid.chergui@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.bilal.ferhat@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.djamel.aoudia@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.nabil.oukaci@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.mourad.benzerga@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.tarek.hamdani@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now());

-- The trigger on_auth_user_created now fires 10 times and inserts profiles rows with role='prestataire'.

insert into public.prestataire_profiles (id, display_name, bio, categories, wilaya, commune, years_experience, badge, is_visible)
values
  ('00000000-0000-0000-0000-000000000001','Karim Benali','Électricien certifié avec 8 ans d''expérience à Alger. Installations, dépannages et mises aux normes.',ARRAY['electricien'],'Alger','Alger Centre',8,'unverified',true),
  ('00000000-0000-0000-0000-000000000002','Yacine Mammeri','Plombier professionnel disponible 7j/7 à Alger. Fuites, canalisations, ballons d''eau chaude.',ARRAY['plombier'],'Alger','Bab El Oued',5,'unverified',true),
  ('00000000-0000-0000-0000-000000000003','Rachid Bensalem','Peintre bâtiment à Oran. Travaux intérieurs et extérieurs, enduits, peinture décorative.',ARRAY['peintre'],'Oran','Bir El Djir',10,'unverified',true),
  ('00000000-0000-0000-0000-000000000004','Sofiane Boudiaf','Technicien informatique à Oran. Réparation PC, installation réseaux, maintenance entreprise.',ARRAY['informaticien'],'Oran','Es Sénia',6,'unverified',true),
  ('00000000-0000-0000-0000-000000000005','Hamid Chergui','Menuisier aluminium et PVC à Constantine. Portes, fenêtres, cuisines équipées sur mesure.',ARRAY['menuisier'],'Constantine','El Khroub',12,'unverified',true),
  ('00000000-0000-0000-0000-000000000006','Bilal Ferhat','Électricien à Constantine. Tableaux électriques, prises, éclairage, installation domotique.',ARRAY['electricien'],'Constantine','Constantine Centre',4,'unverified',true),
  ('00000000-0000-0000-0000-000000000007','Djamel Aoudia','Climaticien agréé à Béjaïa. Installation et maintenance de climatiseurs toutes marques.',ARRAY['climaticien'],'Béjaïa','Béjaïa Centre',7,'unverified',true),
  ('00000000-0000-0000-0000-000000000008','Nabil Oukaci','Plombier à Béjaïa. Sanitaires, chauffage central, détection et réparation de fuites.',ARRAY['plombier'],'Béjaïa','Akbou',9,'unverified',true),
  ('00000000-0000-0000-0000-000000000009','Mourad Benzerga','Frigoriste professionnel à Mostaganem. Chambres froides, réfrigération commerciale et industrielle.',ARRAY['frigoriste'],'Mostaganem','Mostaganem Centre',15,'unverified',true),
  ('00000000-0000-0000-0000-000000000010','Tarek Hamdani','Peintre décorateur à Mostaganem. Rénovation intérieure, papier peint, faux plafond et staff.',ARRAY['peintre'],'Mostaganem','Sidi Ali',3,'unverified',true);
