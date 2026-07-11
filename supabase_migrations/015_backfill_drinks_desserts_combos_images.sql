-- Backfill image_url for the categories that previously relied only on the
-- local imageMap, which is not stored in Supabase.
UPDATE public.menu_items
SET image_url = CASE slug
  WHEN 'veg-loaded-french-fries' THEN '/images/menu/generated/veg-loaded-french-fries.png'
  WHEN 'paneer-loaded-french-fries' THEN '/images/menu/generated/paneer-loaded-french-fries.png'
  WHEN 'chicken-loaded-french-fries' THEN '/images/menu/generated/chicken-loaded-french-fries.png'
  WHEN 'vanilla-milkshake' THEN '/images/menu/generated/vanilla_milkshake.png'
  WHEN 'strawberry-milkshake' THEN '/images/menu/generated/vanilla_milkshake.png'
  WHEN 'butterscotch-milkshake' THEN '/images/menu/generated/vanilla_milkshake.png'
  WHEN 'chocolate-milkshake' THEN '/images/menu/generated/chocolate_milkshake.png'
  WHEN 'black-currant-milkshake' THEN '/images/menu/generated/vanilla_milkshake.png'
  WHEN 'oreo-milkshake' THEN '/images/menu/generated/vanilla_milkshake.png'
  WHEN 'kitkat-milkshake' THEN '/images/menu/generated/vanilla_milkshake.png'
  WHEN 'brownie-milkshake' THEN '/images/menu/generated/vanilla_milkshake.png'
  WHEN 'ice-cream-scoop' THEN '/images/menu/generated/ice-cream-scoop.png'
  WHEN 'brownie-with-ice-cream' THEN '/images/menu/generated/brownie_icecream.png'
  WHEN 'chocolava-with-ice-cream' THEN '/images/menu/generated/chocolava-with-ice-cream.png'
  WHEN 'mint-mojito' THEN '/images/menu/generated/blue_mojito.png'
  WHEN 'blue-curacao-mojito' THEN '/images/menu/generated/blue-curacao-mojito.png'
  WHEN 'grape-mojito' THEN '/images/menu/generated/grape-mojito.png'
  WHEN 'mango-mojito' THEN '/images/menu/generated/mango-mojito.png'
  WHEN 'strawberry-mojito' THEN '/images/menu/generated/red_mojito.png'
  WHEN 'guava-mojito' THEN '/images/menu/generated/guava-mojito.png'
  WHEN 'pineapple-mojito' THEN '/images/menu/generated/pineapple-mojito.png'
  WHEN 'green-apple-mojito' THEN '/images/menu/generated/blue_mojito.png'
  WHEN 'pomegranate-mojito' THEN '/images/menu/generated/pomegranate-mojito.png'
  WHEN 'watermelon-mojito' THEN '/images/menu/generated/red_mojito.png'
  WHEN 'orange-mojito' THEN '/images/menu/generated/orange-mojito.png'
  WHEN 'blue-berry-mojito' THEN '/images/menu/generated/blue-berry-mojito.png'
  WHEN 'combo-offer-1' THEN 'https://images.unsplash.com/photo-1594212691511-2eb26fc230eb?w=800&q=80'
  WHEN 'special-chicken-combo-offer' THEN 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80'
  WHEN 'mega-chicken-combo-offer' THEN 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80'
  WHEN 'super-delicious-burger-combo' THEN 'https://images.unsplash.com/photo-1594212691511-2eb26fc230eb?w=800&q=80'
  WHEN 'chicken-burger-combo' THEN 'https://images.unsplash.com/photo-1605333315993-9d41ff17c1ec?w=800&q=80'
  ELSE image_url
END
WHERE slug IN (
  'veg-loaded-french-fries', 'paneer-loaded-french-fries', 'chicken-loaded-french-fries',
  'vanilla-milkshake', 'strawberry-milkshake', 'butterscotch-milkshake', 'chocolate-milkshake',
  'black-currant-milkshake', 'oreo-milkshake', 'kitkat-milkshake', 'brownie-milkshake',
  'ice-cream-scoop', 'brownie-with-ice-cream', 'chocolava-with-ice-cream',
  'mint-mojito', 'blue-curacao-mojito', 'grape-mojito', 'mango-mojito', 'strawberry-mojito',
  'guava-mojito', 'pineapple-mojito', 'green-apple-mojito', 'pomegranate-mojito',
  'watermelon-mojito', 'orange-mojito', 'blue-berry-mojito', 'combo-offer-1',
  'special-chicken-combo-offer', 'mega-chicken-combo-offer', 'super-delicious-burger-combo',
  'chicken-burger-combo'
);
