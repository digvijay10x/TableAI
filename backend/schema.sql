-- ============================================
-- TableAI: Schema + Seed Data
-- ============================================

-- 1. TABLES
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'restaurant')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  calories INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_order NUMERIC(10,2) NOT NULL
);

CREATE TABLE taste_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_tags TEXT[] DEFAULT '{}',
  avoided_tags TEXT[] DEFAULT '{}',
  avg_budget NUMERIC(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE taste_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON restaurants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON taste_profile FOR ALL USING (true) WITH CHECK (true);

-- 3. SEED DATA: 10 Restaurants with menu items
-- ============================================

-- We use static UUIDs so we can reference them in menu_items inserts

-- Restaurant owners (dummy users with restaurant role)
INSERT INTO users (id, email, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'owner.spiceroute@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000002', 'owner.dragonnoodles@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000003', 'owner.bellanapoli@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000004', 'owner.burgerhaus@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000005', 'owner.greenbowl@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000006', 'owner.tandoorinights@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000007', 'owner.sushicraft@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000008', 'owner.chaatcorner@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000009', 'owner.ketokitchen@demo.com', 'restaurant'),
  ('a1000000-0000-0000-0000-000000000010', 'owner.desidhaba@demo.com', 'restaurant');

-- Demo customer
INSERT INTO users (id, email, role) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'customer@demo.com', 'customer');

-- Taste profile for demo customer
INSERT INTO taste_profile (user_id, preferred_tags, avoided_tags, avg_budget, total_orders) VALUES
  ('c1000000-0000-0000-0000-000000000001', '{"spicy","indian","comfort"}', '{"seafood"}', 250, 0);

-- Restaurants
INSERT INTO restaurants (id, owner_id, name, description) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Spice Route', 'Authentic South Indian cuisine with a modern twist'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Dragon Noodles', 'Indo-Chinese street food favorites'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Bella Napoli', 'Wood-fired pizzas and fresh Italian pastas'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'Burger Haus', 'Gourmet burgers and loaded fries'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'Green Bowl', 'Plant-based bowls, smoothies, and salads'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'Tandoori Nights', 'North Indian curries and fresh tandoor breads'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'Sushi Craft', 'Japanese sushi rolls and bento boxes'),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'Chaat Corner', 'Mumbai-style street food and chaats'),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 'Keto Kitchen', 'Low-carb, high-protein meals for fitness lovers'),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010', 'Desi Dhaba', 'Highway-style Punjabi food with big portions');

-- Menu Items (6-8 per restaurant)

-- 1. Spice Route (South Indian)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Masala Dosa', 'Crispy crepe filled with spiced potato masala, served with sambar and chutney', 120, 350, '{"south-indian","breakfast","crispy","comfort"}', true),
  ('b1000000-0000-0000-0000-000000000001', 'Idli Sambar', 'Steamed rice cakes with lentil soup and coconut chutney', 80, 220, '{"south-indian","breakfast","light","healthy"}', true),
  ('b1000000-0000-0000-0000-000000000001', 'Chettinad Chicken Curry', 'Fiery chicken curry with roasted spices and curry leaves', 220, 480, '{"south-indian","spicy","non-veg","curry"}', false),
  ('b1000000-0000-0000-0000-000000000001', 'Medu Vada', 'Crispy fried lentil donuts served with sambar', 90, 300, '{"south-indian","snack","crispy","fried"}', true),
  ('b1000000-0000-0000-0000-000000000001', 'Filter Coffee', 'Traditional South Indian filter coffee, strong and frothy', 50, 80, '{"beverage","coffee","south-indian"}', true),
  ('b1000000-0000-0000-0000-000000000001', 'Uttapam', 'Thick rice pancake topped with onions, tomatoes, and green chilies', 110, 310, '{"south-indian","breakfast","comfort"}', true),
  ('b1000000-0000-0000-0000-000000000001', 'Rasam Rice', 'Steamed rice with tangy pepper-tomato rasam', 100, 280, '{"south-indian","comfort","light","tangy"}', true);

-- 2. Dragon Noodles (Indo-Chinese)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'Hakka Noodles', 'Stir-fried noodles with vegetables and soy sauce', 150, 420, '{"chinese","noodles","stir-fry"}', true),
  ('b1000000-0000-0000-0000-000000000002', 'Chilli Chicken', 'Crispy fried chicken tossed in spicy chilli sauce', 200, 520, '{"chinese","spicy","non-veg","fried"}', false),
  ('b1000000-0000-0000-0000-000000000002', 'Manchurian Gravy', 'Vegetable balls in thick spicy-sweet Manchurian sauce', 160, 380, '{"chinese","spicy","comfort","gravy"}', true),
  ('b1000000-0000-0000-0000-000000000002', 'Spring Rolls', 'Crispy rolls stuffed with cabbage and carrot filling', 120, 280, '{"chinese","snack","crispy","fried"}', true),
  ('b1000000-0000-0000-0000-000000000002', 'Fried Rice', 'Wok-tossed rice with eggs, vegetables, and soy', 140, 450, '{"chinese","rice","stir-fry"}', false),
  ('b1000000-0000-0000-0000-000000000002', 'Sweet Corn Soup', 'Creamy sweet corn soup with a hint of pepper', 100, 180, '{"chinese","soup","light"}', true),
  ('b1000000-0000-0000-0000-000000000002', 'Dragon Chicken', 'Boneless chicken in fiery dragon sauce with peppers', 230, 550, '{"chinese","spicy","non-veg","premium"}', false),
  ('b1000000-0000-0000-0000-000000000002', 'Paneer Chilli', 'Crispy paneer cubes tossed with bell peppers and chilli flakes', 180, 400, '{"chinese","spicy","paneer"}', true);

-- 3. Bella Napoli (Italian)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000003', 'Margherita Pizza', 'Classic pizza with fresh mozzarella, tomato sauce, and basil', 250, 600, '{"italian","pizza","comfort","classic"}', true),
  ('b1000000-0000-0000-0000-000000000003', 'Penne Arrabbiata', 'Penne pasta in spicy tomato sauce with garlic and chilli flakes', 220, 480, '{"italian","pasta","spicy"}', true),
  ('b1000000-0000-0000-0000-000000000003', 'Chicken Alfredo', 'Fettuccine in creamy white sauce with grilled chicken', 280, 650, '{"italian","pasta","creamy","non-veg"}', false),
  ('b1000000-0000-0000-0000-000000000003', 'Bruschetta', 'Toasted bread topped with diced tomatoes, garlic, and olive oil', 150, 220, '{"italian","snack","light"}', true),
  ('b1000000-0000-0000-0000-000000000003', 'Tiramisu', 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone', 180, 350, '{"italian","dessert","coffee","premium"}', true),
  ('b1000000-0000-0000-0000-000000000003', 'Pepperoni Pizza', 'Loaded with spicy pepperoni and mozzarella cheese', 300, 720, '{"italian","pizza","spicy","non-veg"}', false),
  ('b1000000-0000-0000-0000-000000000003', 'Minestrone Soup', 'Hearty Italian vegetable soup with beans and pasta', 140, 200, '{"italian","soup","healthy","light"}', true);

-- 4. Burger Haus (Burgers & Fast Food)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000004', 'Classic Smash Burger', 'Double-smashed beef patties with cheese, lettuce, and secret sauce', 250, 680, '{"burger","non-veg","comfort","classic"}', false),
  ('b1000000-0000-0000-0000-000000000004', 'Paneer Tikka Burger', 'Spiced paneer patty with mint mayo and pickled onions', 200, 520, '{"burger","paneer","indian-fusion"}', true),
  ('b1000000-0000-0000-0000-000000000004', 'Loaded Cheese Fries', 'Crispy fries topped with cheddar sauce, jalapenos, and bacon bits', 180, 580, '{"snack","fried","comfort","cheesy"}', false),
  ('b1000000-0000-0000-0000-000000000004', 'BBQ Chicken Burger', 'Grilled chicken with smoky BBQ sauce, coleslaw, and cheese', 270, 620, '{"burger","non-veg","bbq","smoky"}', false),
  ('b1000000-0000-0000-0000-000000000004', 'Veggie Crunch Burger', 'Crispy vegetable patty with crunchy slaw and chipotle mayo', 180, 450, '{"burger","healthy","crispy"}', true),
  ('b1000000-0000-0000-0000-000000000004', 'Oreo Milkshake', 'Thick milkshake blended with Oreo cookies and vanilla ice cream', 150, 480, '{"beverage","dessert","sweet"}', true),
  ('b1000000-0000-0000-0000-000000000004', 'Chicken Wings', 'Crispy fried wings tossed in buffalo hot sauce', 220, 540, '{"snack","non-veg","spicy","fried"}', false);

-- 5. Green Bowl (Healthy / Plant-Based)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000005', 'Quinoa Power Bowl', 'Quinoa with roasted vegetables, avocado, and tahini dressing', 280, 380, '{"healthy","bowl","protein","light"}', true),
  ('b1000000-0000-0000-0000-000000000005', 'Berry Smoothie Bowl', 'Blended berries topped with granola, chia seeds, and banana', 220, 310, '{"healthy","breakfast","sweet","light"}', true),
  ('b1000000-0000-0000-0000-000000000005', 'Falafel Wrap', 'Crispy falafel with hummus, pickled veggies in whole wheat wrap', 200, 420, '{"healthy","wrap","protein","mediterranean"}', true),
  ('b1000000-0000-0000-0000-000000000005', 'Green Detox Juice', 'Cold-pressed spinach, cucumber, apple, and ginger juice', 150, 90, '{"beverage","healthy","detox","light"}', true),
  ('b1000000-0000-0000-0000-000000000005', 'Avocado Toast', 'Sourdough toast with smashed avocado, cherry tomatoes, and seeds', 180, 280, '{"healthy","breakfast","light"}', true),
  ('b1000000-0000-0000-0000-000000000005', 'Chickpea Salad', 'Mediterranean chickpea salad with feta, olives, and lemon dressing', 190, 320, '{"healthy","salad","protein","mediterranean"}', true);

-- 6. Tandoori Nights (North Indian)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000006', 'Butter Chicken', 'Tender chicken in rich tomato-butter gravy with cream', 260, 550, '{"indian","curry","creamy","non-veg","comfort"}', false),
  ('b1000000-0000-0000-0000-000000000006', 'Dal Makhani', 'Slow-cooked black lentils in buttery creamy gravy', 180, 380, '{"indian","curry","creamy","comfort","protein"}', true),
  ('b1000000-0000-0000-0000-000000000006', 'Tandoori Roti', 'Fresh whole wheat bread baked in clay tandoor', 30, 120, '{"indian","bread","light"}', true),
  ('b1000000-0000-0000-0000-000000000006', 'Paneer Butter Masala', 'Cottage cheese cubes in smooth tomato-cashew gravy', 220, 480, '{"indian","curry","creamy","paneer","comfort"}', true),
  ('b1000000-0000-0000-0000-000000000006', 'Chicken Biryani', 'Fragrant basmati rice layered with spiced chicken and saffron', 240, 580, '{"indian","rice","spicy","non-veg","premium"}', false),
  ('b1000000-0000-0000-0000-000000000006', 'Garlic Naan', 'Soft leavened bread with garlic and butter from the tandoor', 50, 180, '{"indian","bread","garlic"}', true),
  ('b1000000-0000-0000-0000-000000000006', 'Gulab Jamun', 'Deep-fried milk dumplings soaked in rose-cardamom sugar syrup', 80, 300, '{"indian","dessert","sweet"}', true),
  ('b1000000-0000-0000-0000-000000000006', 'Tandoori Chicken', 'Whole chicken leg marinated in yogurt and spices, chargrilled', 200, 420, '{"indian","tandoor","spicy","non-veg","protein"}', false);

-- 7. Sushi Craft (Japanese)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000007', 'California Roll', 'Crab, avocado, and cucumber inside-out roll with sesame', 300, 280, '{"japanese","sushi","seafood","light"}', false),
  ('b1000000-0000-0000-0000-000000000007', 'Chicken Katsu Bento', 'Crispy breaded chicken with rice, salad, and miso soup', 350, 620, '{"japanese","bento","non-veg","comfort"}', false),
  ('b1000000-0000-0000-0000-000000000007', 'Edamame', 'Steamed soybean pods with sea salt', 120, 120, '{"japanese","snack","healthy","protein"}', true),
  ('b1000000-0000-0000-0000-000000000007', 'Miso Soup', 'Traditional Japanese soup with tofu, seaweed, and green onions', 100, 80, '{"japanese","soup","light","healthy"}', true),
  ('b1000000-0000-0000-0000-000000000007', 'Spicy Tuna Roll', 'Fresh tuna with spicy mayo and cucumber roll', 320, 300, '{"japanese","sushi","seafood","spicy"}', false),
  ('b1000000-0000-0000-0000-000000000007', 'Veggie Tempura', 'Lightly battered and fried seasonal vegetables', 200, 340, '{"japanese","fried","crispy","light"}', true),
  ('b1000000-0000-0000-0000-000000000007', 'Matcha Ice Cream', 'Creamy green tea flavored ice cream', 150, 220, '{"japanese","dessert","sweet"}', true);

-- 8. Chaat Corner (Mumbai Street Food)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000008', 'Pani Puri', 'Crispy hollow puris filled with spiced water, potato, and chickpeas', 60, 200, '{"street-food","spicy","tangy","snack"}', true),
  ('b1000000-0000-0000-0000-000000000008', 'Sev Puri', 'Flat puris topped with potato, chutneys, onion, and sev', 80, 250, '{"street-food","tangy","snack","crispy"}', true),
  ('b1000000-0000-0000-0000-000000000008', 'Vada Pav', 'Spiced potato fritter in a soft bun with garlic chutney', 50, 350, '{"street-food","comfort","spicy","mumbai"}', true),
  ('b1000000-0000-0000-0000-000000000008', 'Bhel Puri', 'Puffed rice mixed with vegetables, tamarind, and mint chutney', 70, 220, '{"street-food","tangy","light","snack"}', true),
  ('b1000000-0000-0000-0000-000000000008', 'Pav Bhaji', 'Spiced mashed vegetable curry served with buttered bread rolls', 120, 480, '{"street-food","comfort","spicy","mumbai"}', true),
  ('b1000000-0000-0000-0000-000000000008', 'Dahi Puri', 'Crispy puris filled with yogurt, potato, and sweet tamarind chutney', 80, 230, '{"street-food","sweet","tangy","snack"}', true),
  ('b1000000-0000-0000-0000-000000000008', 'Misal Pav', 'Spicy sprouted moth bean curry with bread rolls and farsan', 100, 400, '{"street-food","spicy","protein","maharashtrian"}', true),
  ('b1000000-0000-0000-0000-000000000008', 'Cutting Chai', 'Strong milky tea served in a small glass, Mumbai style', 20, 60, '{"beverage","tea","mumbai"}', true);

-- 9. Keto Kitchen (Low-Carb / High Protein)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000009', 'Grilled Chicken Breast', 'Herb-marinated chicken breast grilled to perfection, served with steamed broccoli', 280, 320, '{"keto","protein","non-veg","healthy","grilled"}', false),
  ('b1000000-0000-0000-0000-000000000009', 'Egg White Omelette', 'Fluffy egg white omelette with spinach, mushrooms, and cheese', 180, 220, '{"keto","breakfast","protein","healthy"}', false),
  ('b1000000-0000-0000-0000-000000000009', 'Cauliflower Rice Bowl', 'Riced cauliflower with grilled paneer, avocado, and pesto', 250, 280, '{"keto","bowl","healthy","low-carb"}', true),
  ('b1000000-0000-0000-0000-000000000009', 'Protein Smoothie', 'Whey protein blended with almond milk, peanut butter, and cocoa', 200, 280, '{"keto","beverage","protein","healthy"}', true),
  ('b1000000-0000-0000-0000-000000000009', 'Chicken Caesar Salad', 'Romaine lettuce with grilled chicken, parmesan, and Caesar dressing', 260, 350, '{"keto","salad","non-veg","protein"}', false),
  ('b1000000-0000-0000-0000-000000000009', 'Paneer Steak', 'Thick paneer slab pan-seared with herbs and served with sauteed veggies', 240, 380, '{"keto","protein","paneer","grilled"}', true),
  ('b1000000-0000-0000-0000-000000000009', 'Almond Flour Pancakes', 'Low-carb pancakes made with almond flour and topped with berries', 220, 260, '{"keto","breakfast","sweet","low-carb"}', true);

-- 10. Desi Dhaba (Punjabi Highway Style)
INSERT INTO menu_items (restaurant_id, name, description, price, calories, tags, is_veg) VALUES
  ('b1000000-0000-0000-0000-000000000010', 'Chole Bhature', 'Spiced chickpea curry with deep-fried fluffy bread', 130, 580, '{"indian","punjabi","comfort","spicy","fried"}', true),
  ('b1000000-0000-0000-0000-000000000010', 'Rajma Chawal', 'Kidney bean curry served with steamed basmati rice', 120, 450, '{"indian","punjabi","comfort","protein"}', true),
  ('b1000000-0000-0000-0000-000000000010', 'Sarson Ka Saag', 'Slow-cooked mustard greens with butter and spices, served with makki roti', 140, 350, '{"indian","punjabi","healthy","traditional"}', true),
  ('b1000000-0000-0000-0000-000000000010', 'Mutton Rogan Josh', 'Tender mutton cooked in Kashmiri spice gravy', 300, 520, '{"indian","spicy","non-veg","premium","curry"}', false),
  ('b1000000-0000-0000-0000-000000000010', 'Aloo Paratha', 'Stuffed potato flatbread served with butter, curd, and pickle', 80, 380, '{"indian","punjabi","breakfast","comfort"}', true),
  ('b1000000-0000-0000-0000-000000000010', 'Lassi', 'Thick chilled yogurt drink, sweet or salted', 60, 180, '{"beverage","punjabi","sweet","refreshing"}', true),
  ('b1000000-0000-0000-0000-000000000010', 'Chicken Curry', 'Home-style chicken curry with thick onion-tomato gravy', 180, 450, '{"indian","punjabi","non-veg","comfort","curry"}', false),
  ('b1000000-0000-0000-0000-000000000010', 'Jeera Rice', 'Basmati rice tempered with cumin seeds and ghee', 80, 250, '{"indian","rice","light","side"}', true);