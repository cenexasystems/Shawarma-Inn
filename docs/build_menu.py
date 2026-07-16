import json, re

raw = json.load(open('menu-raw.json', encoding='utf-8'))['products']

CAT_MAP = {
    'Roll Shawarma': 'Shawarma',
    'Plate Shawarma': 'Shawarma',
    'Burgers Veg': 'Burgers',
    'Burgers Chicken': 'Burgers',
    'Pizza Veg': 'Pizza',
    'Pizza Chicken': 'Pizza',
    'Momos Veg': 'Momos',
    'Momos Chicken': 'Momos',
    'Toast Veg': 'Toasts',
    'Toast Chicken': 'Toasts',
    'Starters Veg': 'Starters',
    'Starters Chicken': 'Starters',
    'Loaded Fries': 'Loaded Fries',
    'Bring Your Own Chips': 'Bring Your Own Chips',
    'Desserts': 'Desserts',
    'Mojito': 'Mojitos',
    'Milkshake': 'Milkshakes',
    'Waffle': 'Waffles',
    'Combo Deals': 'Combo Deals',
}

CAT_SLUG = {
    'Shawarma': 'shawarma', 'Burgers': 'burgers', 'Pizza': 'pizza', 'Momos': 'momos',
    'Toasts': 'toasts', 'Starters': 'starters', 'Loaded Fries': 'loaded-fries',
    'Bring Your Own Chips': 'bring-your-own-chips', 'Mojitos': 'mojitos',
    'Milkshakes': 'milkshakes', 'Waffles': 'waffles', 'Desserts': 'desserts',
    'Combo Deals': 'combo-deals',
}

NONVEG_WORDS = ['chicken', 'mutton', 'beef', 'sausage']

BESTSELLER_RULES = [
    ('shawarma roll', 'classic'), # handled specially below
]

DESC_TEMPLATES = {
    'Shawarma': "Loaded {flavor} shawarma wrapped in soft kuboos with house sauces.",
    'Burgers': "Juicy {flavor} patty stacked with fresh toppings in a soft bun.",
    'Pizza': "Hand-stretched pizza topped with {flavor} and melted cheese.",
    'Momos': "Steamed dumplings filled with {flavor}, served with spicy chutney.",
    'Toasts': "Grilled toast loaded with {flavor} and melted cheese.",
    'Starters': "Crispy {flavor}, fried to order and served hot.",
    'Loaded Fries': "Crispy fries piled high with {flavor} and sauces.",
    'Bring Your Own Chips': "Your favourite chips topped fresh with {flavor}.",
    'Mojitos': "Refreshing {flavor} mojito with soda and crushed ice.",
    'Milkshakes': "Thick and creamy {flavor} milkshake, blended fresh.",
    'Waffles': "Warm waffle drizzled with {flavor}.",
    'Desserts': "Indulgent {flavor}, the perfect sweet finish.",
    'Combo Deals': "Combo deal: {flavor}.",
}

STRIP_WORDS = {
    'Burgers': ['burger'],
    'Pizza': ['pizza'],
    'Momos': ['momos'],
    'Toasts': ['toast'],
}

def clean_flavor_phrase(category, base_name):
    phrase = re.sub(r'\(.*?\)', '', base_name).strip().lower()
    for w in STRIP_WORDS.get(category, []):
        phrase = re.sub(rf'\b{w}\b', '', phrase).strip()
    phrase = re.sub(r'\s+', ' ', phrase)
    return phrase or base_name.lower()

def slugify(s):
    s = s.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def is_veg(section, name):
    n = name.lower()
    if section in ('Mojitos', 'Milkshakes', 'Waffles', 'Desserts', 'Mojito', 'Milkshake', 'Waffle'):
        return True
    if section == 'Combo Deals':
        return False
    for w in NONVEG_WORDS:
        if w in n:
            return False
    if section in ('Roll Shawarma', 'Plate Shawarma'):
        # Default flavored shawarmas (Peri Peri, BBQ, Schezwan, etc.) are chicken-based;
        # only explicit Veg/Paneer items and the universal cheese/kuboos add-ons are veg.
        return ('veg' in n) or ('paneer' in n) or ('add on' in n)
    if 'veg' in section.lower():
        return True
    if section in ('Pizza Veg', 'Pizza Chicken'):
        return section == 'Pizza Veg'
    return True

def short_desc(category, flavor_phrase):
    tmpl = DESC_TEMPLATES[category]
    desc = tmpl.format(flavor=flavor_phrase)
    words = desc.split()
    if len(words) > 15:
        desc = ' '.join(words[:15])
    return desc

items = []
seen_names = set()

def add_item(name, category, price, flavor_phrase, veg, note=None):
    base_slug = slugify(name)
    slug = base_slug
    n = 2
    while slug in seen_names:
        slug = f"{base_slug}-{n}"
        n += 1
    seen_names.add(slug)
    image = f"/images/menu/{CAT_SLUG[category]}/{slug}.webp"
    desc = note if note else short_desc(category, flavor_phrase)
    words = desc.split()
    if len(words) > 15:
        desc = ' '.join(words[:15])
    items.append({
        'id': len(items) + 1,
        'slug': slug,
        'name': name,
        'category': category,
        'price': price,
        'desc': desc,
        'image': image,
        'isVeg': veg,
        'bestseller': False,
        'rating': 4.6,
    })

for p in raw:
    section = p['section']
    category = CAT_MAP[section]
    base_name = p['name']
    variants = p['variants']
    note = p.get('note')

    # Skip the dessert-page duplicate of Brownie Milk Shake (kept under Milkshakes)
    if category == 'Desserts' and base_name == 'Brownie Milk Shake':
        continue

    veg = is_veg(section, base_name)

    if section in ('Roll Shawarma', 'Plate Shawarma') and len(variants) == 2 and variants[0]['label'] == 'Reg' and variants[1]['label'] == 'Spl' and 'Add on' not in base_name:
        style = 'Roll' if section == 'Roll Shawarma' else 'Plate'
        flavor = base_name.replace(' Shawarma', '').replace(' Plate', '').strip()
        if flavor.lower() in ('roll shawarma', 'plate shawarma', '', 'shawarma', 'roll', 'plate'):
            flavor = 'Classic'
        display_name_reg = f"{flavor} Shawarma {style}"
        display_name_spl = f"{flavor} Shawarma {style} (Large)"
        flavor_phrase = flavor.lower() if veg else f"{flavor.lower()} chicken"
        add_item(display_name_reg, category, variants[0]['price'], flavor_phrase, veg)
        add_item(display_name_spl, category, variants[1]['price'], flavor_phrase, veg)
        continue

    # Single-variant or addon items: one product per variant entry
    for v in variants:
        name = base_name
        if len(variants) > 1:
            name = f"{base_name} ({v['label']})"
        flavor_phrase = clean_flavor_phrase(category, base_name)
        add_item(name, category, v['price'], flavor_phrase, veg, note=note)

# Bestseller assignment
BESTSELLER_TARGETS = [
    'Classic Shawarma Roll',
    'Peri Peri Shawarma Roll',
    'BBQ Shawarma Roll',
    'Zinger Chicken Burger',
    'Chicken Pizza',
    'Chicken Momos',
    'Chicken Loaded French Fries',
    'Mint Mojito',
    'Oreo Milkshake',
    'Nutella Waffle',
]
for item in items:
    if item['name'] in BESTSELLER_TARGETS:
        item['bestseller'] = True

# Verification
names = [i['name'] for i in items]
dupes = [n for n in set(names) if names.count(n) > 1]
missing_price = [i['name'] for i in items if not i.get('price')]

by_cat = {}
for i in items:
    by_cat.setdefault(i['category'], []).append(i)

print('TOTAL PRODUCTS:', len(items))
print('DUPLICATES:', dupes)
print('MISSING PRICES:', missing_price)
for cat in sorted(by_cat):
    print(f"  {cat}: {len(by_cat[cat])}")
print('BESTSELLERS:', [i['name'] for i in items if i['bestseller']])

json.dump(items, open('menu-final.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

missing_images = [{'name': i['name'], 'category': i['category'], 'image': i['image']} for i in items]
json.dump(missing_images, open('missing-images-report.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

report = {
    'totalProducts': len(items),
    'totalCategories': len(by_cat),
    'categories': {cat: len(by_cat[cat]) for cat in sorted(by_cat)},
    'totalCombos': len(by_cat.get('Combo Deals', [])),
    'totalDesserts': len(by_cat.get('Desserts', [])),
    'totalBeverages': len(by_cat.get('Mojitos', [])) + len(by_cat.get('Milkshakes', [])),
    'missingPrices': missing_price,
    'duplicateProducts': dupes,
    'bestsellers': [i['name'] for i in items if i['bestseller']],
}
json.dump(report, open('validation-report.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print('\nWrote menu-final.json, missing-images-report.json, validation-report.json')
