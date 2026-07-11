-- Keep production menu rows self-contained. These paths point to files bundled
-- from public/images/menu and are readable by both localhost and Vercel.
UPDATE public.menu_items
SET image_url = CASE slug
  WHEN 'mix-veg-momos' THEN '/images/menu/generated/veg_momos.png'
  WHEN 'cheese-corn-momos' THEN '/images/menu/generated/veg_momos.png'
  WHEN 'paneer-tikka-momos' THEN '/images/menu/momos/paneer-momos.png'
  WHEN 'chicken-momos' THEN '/images/menu/generated/chicken_momos.png'
  WHEN 'peri-peri-chicken-momos' THEN '/images/menu/momos/peri-peri-momos.png'
  WHEN 'schezwan-chicken-momos' THEN '/images/menu/generated/chicken_momos.png'
  WHEN 'chicken-tikka-momos' THEN '/images/menu/generated/chicken_momos.png'
  WHEN 'veg-pizza' THEN '/images/menu/pizzas/veg-supreme-pizza.png'
  WHEN 'cheese-pizza' THEN '/images/menu/pizzas/double-cheese-pizza.png'
  WHEN 'sweet-corn-pizza' THEN '/images/menu/pizzas/farm-fresh-pizza.png'
  WHEN 'paneer-pizza' THEN '/images/menu/pizzas/paneer-tikka-pizza.png'
  WHEN 'chicken-pizza' THEN '/images/menu/pizzas/chicken-pizza.png'
  WHEN 'bbq-chicken-pizza' THEN '/images/menu/pizzas/bbq-chicken-pizza.png'
  WHEN 'naked-chicken-pizza' THEN '/images/menu/pizzas/chicken-supreme-pizza.png'
  ELSE image_url
END
WHERE slug IN (
  'mix-veg-momos', 'cheese-corn-momos', 'paneer-tikka-momos',
  'chicken-momos', 'peri-peri-chicken-momos', 'schezwan-chicken-momos',
  'chicken-tikka-momos', 'veg-pizza', 'cheese-pizza', 'sweet-corn-pizza',
  'paneer-pizza', 'chicken-pizza', 'bbq-chicken-pizza', 'naked-chicken-pizza'
);
