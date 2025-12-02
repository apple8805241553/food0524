/**
 * Mock product data for development
 * In a real application, this would be fetched from an API or database
 */
const products = [
  {
    id: "1",
    title: "火山起司炸雞",
    description: "香濃起司爆漿流出，一口咬下酥脆炸雞，罪惡感瞬間爆表。",
    image: "/images/products/fried-chicken.jpg",
    price: 280,
    originalPrice: 320,
    discount: "13%",
    category: "chicken",
  },
  {
    id: "2",
    title: "烤雞",
    description: "慢火烘烤春雞入味，迷迭香繚繞鼻息，鮮嫩多汁超療癒。",
    image: "/images/products/roasted-chicken.jpg",
    price: 350,
    originalPrice: 400,
    discount: "12%",
    category: "chicken",
  },
  {
    id: "3",
    title: "麻辣痛風海鮮鍋",
    description: "蟹螯蝦身堆滿鍋，麻中帶辣衝擊味蕾，爽到停不下來！",
    image: "/images/products/seafood-pot.jpg",
    price: 580,
    originalPrice: 680,
    discount: "15%",
    category: "seafood",
  },
  {
    id: "4",
    title: "黑蒜牛肋燉飯",
    description: "濃縮黑蒜香氣撲鼻，牛肋入味滑嫩，燉飯吸飽精華靈魂。",
    image: "/images/products/beef-risotto.jpg",
    price: 420,
    originalPrice: 480,
    discount: "12%",
    category: "beef",
  },
  {
    id: "5",
    title: "炙燒鮭魚玉子壽司",
    description: "火炙鮭魚油脂飄香，搭配玉子滑嫩綿密，口感層次豐富。",
    image: "/images/products/salmon-sushi.jpg",
    price: 320,
    originalPrice: 380,
    discount: "16%",
    category: "sushi",
  },
  {
    id: "6",
    title: "奶香松露野菇麵",
    description: "松露香氣撲鼻而來，奶香融合野菇精華，每一口都高級感。",
    image: "/images/products/truffle-pasta.jpg",
    price: 380,
    originalPrice: 450,
    discount: "16%",
    category: "pasta",
  },
  {
    id: "7",
    title: "泰式檸檬香茅雞",
    description: "酸辣檸香完美融合香茅，嫩雞微辣清爽，開胃首選沒話說。",
    image: "/images/products/thai-chicken.jpg",
    price: 320,
    originalPrice: 380,
    discount: "16%",
    category: "chicken",
  },
  {
    id: "8",
    title: "蒲燒鰻魚雙拼丼",
    description: "厚切鰻魚淋上蒲燒醬，搭配嫩蛋與米飯，甜鹹交織令人回味。",
    image: "/images/products/eel-rice.jpg",
    price: 450,
    originalPrice: 520,
    discount: "13%",
    category: "rice",
  },
  {
    id: "9",
    title: "韓式起司拉麵鍋",
    description: "濃郁泡菜湯頭搭配起司牽絲，每口都是重擊味蕾的愛戀。",
    image: "/images/products/korean-ramen.jpg",
    price: 320,
    originalPrice: 380,
    discount: "16%",
    category: "noodles",
  },
  {
    id: "10",
    title: "蜂蜜芥末炸雞塊",
    description: "外酥內嫩雞肉爆汁，蜂蜜芥末酸甜勁道，涮嘴到根本停不下。",
    image: "/images/products/honey-chicken.jpg",
    price: 280,
    originalPrice: 320,
    discount: "13%",
    category: "chicken",
  },
  {
    id: "11",
    title: "白酒蒜香蛤蜊鍋",
    description: "清酒佐蒜香點綴海味，蛤蜊爆量鮮甜滿滿，超適合配酒聊天。",
    image: "/images/products/clam-pot.jpg",
    price: 420,
    originalPrice: 480,
    discount: "12%",
    category: "seafood",
  },
  {
    id: "12",
    title: "地獄辣味乾拌麵",
    description: "極致辣感挑戰極限，香辣麻一波波上頭，辣到冒汗也想吃。",
    image: "/images/products/spicy-noodles.jpg",
    price: 280,
    originalPrice: 320,
    discount: "13%",
    category: "noodles",
  },
  {
    id: "13",
    title: "青醬嫩雞燉飯",
    description: "九層塔清香結合嫩雞與奶香燉飯，輕盈又濃郁，層層堆疊。",
    image: "/images/products/pesto-risotto.jpg",
    price: 380,
    originalPrice: 450,
    discount: "16%",
    category: "rice",
  },
  {
    id: "14",
    title: "紅酒燉牛肋佐麵包",
    description: "紅酒慢燉軟嫩牛肋，搭配歐式麵包吸滿湯汁，入口即化超滿足。",
    image: "/images/products/beef-stew.jpg",
    price: 480,
    originalPrice: 550,
    discount: "13%",
    category: "beef",
  },
  {
    id: "15",
    title: "港式煎香蘿蔔糕",
    description: "煎至金黃酥脆外皮，裡頭Q嫩綿密口感，搭配醬油膏最對味。",
    image: "/images/products/radish-cake.jpg",
    price: 220,
    originalPrice: 260,
    discount: "15%",
    category: "dim-sum",
  },
  {
    id: "16",
    title: "墨魚燉飯黑到發亮",
    description: "純墨魚汁燉煮香氣濃郁，每粒米飯吸飽海洋精華，令人上癮。",
    image: "/images/products/squid-ink-risotto.jpg",
    price: 420,
    originalPrice: 480,
    discount: "12%",
    category: "rice",
  },
  {
    id: "17",
    title: "奶油龍蝦燉蔬菜",
    description: "奶香四溢與龍蝦共舞，搭配鮮蔬與濃湯，一道充滿奢華的慰藉。",
    image: "/images/products/lobster-stew.jpg",
    price: 680,
    originalPrice: 780,
    discount: "13%",
    category: "seafood",
  },
  {
    id: "18",
    title: "鹹蛋黃金沙豆腐",
    description: "鹹蛋黃炒出金黃金沙，包裹酥炸豆腐，鹹香酥脆，超級下飯！",
    image: "/images/products/salted-egg-tofu.jpg",
    price: 280,
    originalPrice: 320,
    discount: "13%",
    category: "vegetarian",
  },
];

/**
 * Get all products
 * @param {Object} options - Options for filtering and pagination
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Number of items per page
 * @param {string} options.category - Category to filter by
 * @returns {Object} - Products and pagination info
 */
export function getProducts({ page = 1, limit = 12, category = null } = {}) {
  let filteredProducts = [...products];

  // Apply category filter if provided
  if (category) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === category,
    );
  }

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  // Get items for current page
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

/**
 * Get a single product by ID
 * @param {string} id - Product ID
 * @returns {Object|null} - Product object or null if not found
 */
export function getProductById(id) {
  return products.find((product) => product.id === id) || null;
}

/**
 * Get related products
 * @param {string} productId - Current product ID
 * @param {number} limit - Number of related products to return
 * @returns {Array} - Array of related products
 */
export function getRelatedProducts(productId, limit = 4) {
  const currentProduct = getProductById(productId);

  if (!currentProduct) return [];

  // Get products in the same category, excluding the current product
  const sameCategory = products.filter(
    (product) =>
      product.category === currentProduct.category && product.id !== productId,
  );

  // If we don't have enough products in the same category, add some random products
  let relatedProducts = [...sameCategory];

  if (relatedProducts.length < limit) {
    const otherProducts = products
      .filter(
        (product) =>
          product.category !== currentProduct.category &&
          product.id !== productId,
      )
      .slice(0, limit - relatedProducts.length);

    relatedProducts = [...relatedProducts, ...otherProducts];
  }

  // Shuffle and limit the results
  return relatedProducts.sort(() => 0.5 - Math.random()).slice(0, limit);
}

/**
 * Get product categories
 * @returns {Array} - Array of unique categories
 */
export function getCategories() {
  const categories = [...new Set(products.map((product) => product.category))];
  return categories;
}
