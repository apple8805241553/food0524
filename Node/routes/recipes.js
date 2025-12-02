import express from "express";
import db from "../utils/connect-mysql.js"; // 連接資料庫
import fs from "node:fs/promises";
import { z } from "zod";
import moment from "moment-timezone";
import upload from "../utils/upload-imgs.js";
import jwt from "jsonwebtoken";

const router = express.Router();



// 取得所有食譜（但會依照分頁來分別顯示不同的資料)
router.get('/api', async (req, res) => {
    try {
        const querySchema = z.object({
            page: z.string().regex(/^\d+$/).optional(),
            limit: z.string().regex(/^\d+$/).optional(),
            keyword: z.string().optional(),
            category: z.string().optional(), // 新增 category 過濾參數
        });

        const queryValidation = querySchema.safeParse(req.query);
        if (!queryValidation.success) {
            return res.status(400).json({ success: false, error: "Invalid query parameters" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const keyword = req.query.keyword?.substring(0, 50) || ''; // 限制關鍵字長度
        const category = req.query.category || ''; // 取得 category 參數
        const offset = (page - 1) * limit;

         const keywordCondition = keyword
        // 這行就是看關鍵字有沒有符合標題 或描述  。如果只要符合標題的話，就是把OR後面的拿調
            ? `WHERE r.title LIKE ? OR r.description LIKE ? OR c.name LIKE ?`
            : '';
        // keywordParams 是參數化查詢，防止 SQL injection（例如使用 ? 而不是直接拼字串）
        // 如果只想要搜尋Title的話，這行就改const keywordParams = keyword ? [`%${keyword}%`] : [];
        const keywordParams = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : [];


         // 取得總筆數
        const [countResult] = await db.query(
            `SELECT COUNT(DISTINCT r.id) AS total 
             FROM recipes r 
             LEFT JOIN recipe_category rc ON r.id = rc.recipe_id 
             LEFT JOIN categories_sc c ON rc.category_id = c.id 
             ${keywordCondition}`,
            keywordParams
        );
        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        // 取得分頁資料，包含分類
        const [rows] = await db.query(
            `SELECT 
                r.id, 
                r.title, 
                r.description , 
                r.image, 
                GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ') AS categories 
             FROM 
                recipes r 
             LEFT JOIN 
                recipe_category rc ON r.id = rc.recipe_id 
             LEFT JOIN 
                categories_sc c ON rc.category_id = c.id 
             ${keywordCondition} 
             GROUP BY 
                r.id, r.title, r.description, r.image 
             ORDER BY 
                r.created_at DESC 
             LIMIT ? OFFSET ?`,
            [...keywordParams, limit, offset]
        );

        res.json({
            success: true,
            rows,
            totalPages,
            currentPage: page,
        });
    } catch (err) {
        console.error('取得食譜列表失敗:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});
  

// 取得所有食譜(JOIN分類的版本)
router.get('/api/category', async (req, res) => {
    try {
          const page = parseInt(req.query.page) || 1
        //   這邊的5 就是指一頁幾筆
          const limit = parseInt(req.query.limit) || 80
          const offset = (page - 1) * limit
      
          // 取得總筆數
          const [countResult] = await db.query('SELECT COUNT(*) AS total FROM restaurants')
          const totalItems = countResult[0].total
          const totalPages = Math.ceil(totalItems / limit)
      
          // 取得分頁資料
          const [rows] = await db.query(
            `SELECT r.id, r.title AS recipe_title, r.description AS recipe_description, r.image,GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ') AS categories FROM recipes r LEFT JOIN recipe_category rc ON r.id = rc.recipe_id LEFT JOIN categories_sc c ON rc.category_id = c.id GROUP BY r.id, r.title, r.description ORDER BY r.id LIMIT ? OFFSET ?`,
            [limit, offset]
          )
      
          res.json({
            success: true,
            rows,
            totalPages,
            currentPage: page,
          })
        } catch (err) {
          console.error('取得食譜列表失敗:', err)
          res.status(500).json({ success: false, error: err.message })
        }
      })
// 取得單一食譜
// 這邊是取得單一食譜的API，會根據食譜ID來查詢資料庫，並且將相關的步驟、食材、調味料、關聯食譜和評論一起回傳

router.get('/api/:id', async (req, res) => {
    try {
      const recipeId = req.params.id;
  
      // 查主食譜資料
      const [recipeRows] = await db.query('SELECT * FROM recipes WHERE id = ?', [recipeId]);
      if (!recipeRows.length) {
        return res.status(404).json({ success: false, error: "找不到食譜" });
      }
  
      const recipe = recipeRows[0];
  
      // 查這個食譜對應的所有步驟
      const [stepRows] = await db.query(
        'SELECT step_id, step_order, description FROM steps WHERE recipe_id = ? ORDER BY step_order ASC',
        [recipeId]
      );
  
      // 加進 recipe 裡面
      recipe.steps = stepRows;

      // 查這個食譜對應的所有食材
      const [ingredientRows] = await db.query(
        'SELECT ingredient_id, name, quantity, product_id, unit FROM ingredients WHERE recipe_id = ? ORDER BY ingredient_id ASC',
        [recipeId]
      );
  
      // 加進 recipe 裡面
      recipe.ingredients = ingredientRows;

      // 查這個食譜對應的所有調味料
      const [condimentsRows] = await db.query(
        'SELECT condiment_id, name, quantity, unit,product_id FROM condiments WHERE recipe_id = ? ORDER BY condiment_id ASC',
        [recipeId]
      )
      
      // 加進 recipe 裡面
      recipe.condiments = condimentsRows

      // 查這個食譜對應的關聯食譜
      const [relatedRecipes] = await db.query(
        `SELECT 
           rr.related_recipe_id, 
           r.title, 
           r.description,
            r.image, 
           r.created_at 
         FROM 
           related_recipes rr 
         JOIN 
           recipes r 
         ON 
           rr.related_recipe_id = r.id 
         WHERE 
           rr.recipe_id = ? 
         ORDER BY 
           rr.id ASC`,
        [recipeId]
      );
      
      // 加進 recipe 裡面
      recipe.related_recipes = relatedRecipes;

      // 查這個食譜對應的所有評論
      const [commentRows] = await db.query(

        // 'SELECT id, context, user_id, created_at FROM user_feedbacks WHERE recipes_id = ? ORDER BY id ASC',
        // 下面這段是先將用戶名稱與食譜評論JOIN再一起，接著再將這個JOIN過的評論表塞進這個食譜查詢的JSON檔
        `SELECT 
     uf.id, uf.context,uf.title, uf.user_id, uf.created_at, u.username 
   FROM user_feedbacks uf
   JOIN users u ON uf.user_id = u.user_id
   WHERE uf.recipes_id = ? 
   ORDER BY uf.id ASC`,
        [recipeId]
      );

       // 格式化 created_at，只顯示日期（YYYY-MM-DD）
      //  這邊是先將查詢出的評論commentRows裡面的created_at格式化
      // (原本是直接把commentRows加進recipe ，但現在因為要時間格式化，所以多了下面這步驟)
      //  然後再將時間格式化過的commentsWithFormattedDate加進recipe裡面
    const commentsWithFormattedDate = commentRows.map(comment => {
      comment.created_at = moment(comment.created_at).format('YYYY-MM-DD');  // 格式化日期
      return comment;
    });
  
      // 將時間格式化之後的資料加進 recipe 裡面
      recipe.comments = commentsWithFormattedDate;

      // 在其他查詢後面加入查詢收藏數據
const [favoriteRows] = await db.query(
  `SELECT 
    COUNT(*) as favorite_count,
    GROUP_CONCAT(u.username) as favorited_by
  FROM favorites f
  JOIN users u ON f.user_id = u.user_id
  WHERE f.recipe_id = ?`,
  [recipeId]
);

// 加進 recipe 裡面
recipe.favorites = {
  count: favoriteRows[0].favorite_count,
  users: favoriteRows[0].favorited_by ? favoriteRows[0].favorited_by.split(',') : []
};

// 如果有登入用戶，也可以查詢當前用戶是否收藏過
if (req.my_jwt) {
  const [userFavorite] = await db.query(
    'SELECT id FROM favorites WHERE user_id = ? AND recipe_id = ?',
    [req.my_jwt.user_id, recipeId]
  );
  recipe.is_favorited = userFavorite.length > 0;
}
  
      res.json({ success: true, data: recipe });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

// 新增評論
router.post('/api/feedback', async (req, res) => {
  const { recipeId, userId, title, context,is_like } = req.body;

  // 驗證輸入
  if (!recipeId || !userId || !title || !context || is_like === undefined || is_like === null) {
      return res.status(400).json({ success: false, error: "RecipeId, UserId, Title, and Context are required" });
  }

  try {
      // 插入評論到資料庫
      const [result] = await db.query(
          'INSERT INTO user_feedbacks (recipes_id, user_id, title, context, is_like, created_at) VALUES (?, ?, ?, ?, ?,NOW())',
          [recipeId, userId, title, context,is_like]
      );

      res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
      console.error('新增評論失敗:', error);
      res.status(500).json({ success: false, error: error.message });
  }
});

// 讀取收藏
// 這邊是讀取用戶的收藏食譜，會根據 JWT 中的用戶 ID 來查詢資料庫
router.get('/api/favorite/get', async (req, res) => {
// 驗證是否已通過 JWT 驗證
    if (!req.my_jwt) {
        return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid token" });
    }

    const userId = req.my_jwt.user_id; // 從解碼的 token 中取得 userId

    try {
        // 查詢會員的所有收藏
        const [favorites] = await db.query(
            'SELECT recipe_id FROM favorites WHERE user_id = ?',
            [userId]
        );

        // 將結果轉換為 { recipeId: true } 的格式
        const favoriteStatus = {};
        favorites.forEach(favorite => {
            favoriteStatus[favorite.recipe_id] = true;
        });

        res.json({ success: true, favorites: favoriteStatus });
    } catch (error) {
        console.error('載入收藏狀態失敗:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// 收藏食譜
// 這邊是將食譜的收藏狀態更新，會根據用戶ID和食譜ID來判斷是否已經收藏
router.post('/api/favorite', async (req, res) => {
    const {recipeId } = req.body;

    // 驗證是否已通過 JWT 驗證
    if (!req.my_jwt) {
      return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid token" });
    }
    
    const userId = req.my_jwt.user_id; // 從解碼的 token 中取得 userId
    // 驗證輸入
    if (!recipeId) {
        return res.status(400).json({ success: false, error: "UserId and RecipeId are required" });
    }


     try {
        // 檢查是否已收藏
        const [existingFavorite] = await db.query(
            'SELECT id FROM favorites WHERE user_id = ? AND recipe_id = ?',
            [userId, recipeId]
        );

        if (existingFavorite.length > 0) {
            // 如果已收藏，則取消收藏（刪除記錄）
            await db.query(
                'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
                [userId, recipeId]
            );
            return res.json({ success: true, message: "Favorite removed" });
        } else {
            // 如果未收藏，則新增收藏
            await db.query(
                'INSERT INTO favorites (user_id, recipe_id, created_at) VALUES (?, ?, NOW())',
                [userId, recipeId]
            );
            return res.json({ success: true, message: "Favorite added" });
        }
    } catch (error) {
        console.error('更新收藏狀態失敗:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// 從食譜加進購物車的動作
router.post('/api/add', async (req, res) => {
    // 驗證是否已通過 JWT 驗證
    if (!req.my_jwt) {
        return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid token" });
    }

    const userId = req.my_jwt.user_id; // 從解碼的 token 中取得 userId
    const { ingredients  } = req.body; // 從請求中取得食材資料

    if (
  !ingredients ||
  // !Array.isArray(ingredients) ||
  ingredients.length === 0
) {
  return res.status(400).json({
    success: false,
    error: "Ingredients are required and must be an array",
  });
}

// 從 ingredients 中取出所有的 product_id
const product_id = ingredients.map((item) => item.product_id);

    

    // 驗證輸入
    if (!product_id || !Array.isArray(product_id) || product_id.length === 0) {
        return res.status(400).json({ success: false, error: "Product ID are required and must be an array" });
    }

    try {
       // 查詢每個 product_id 的 original_price，並插入購物車
        const insertPromises = ingredients.map(async (item) => {
            const { product_id } = item;

            // 驗證 product_id 是否有效
            if (!product_id) {
                throw new Error("Each product_id must be valid");
            }

            // 查詢 food_products 表中的 original_price
            const [productRows] = await db.query(
                'SELECT original_price FROM food_products WHERE id = ?',
                [product_id]
            );

            if (productRows.length === 0) {
                throw new Error(`Product with id ${product_id} not found`);
            }

            const unitPrice = productRows[0].original_price;

              // 插入購物車資料表
            return db.query(
                'INSERT INTO carts (user_id, product_id, unit_price, added_time) VALUES (?, ?, ?, NOW())',
                [userId, product_id, unitPrice]
            );
        });
        
        // 等待所有插入操作完成
        await Promise.all(insertPromises);

        res.json({ success: true, message: "Products added to carts successfully" });
    } catch (error) {
        console.error('加入購物車失敗:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// 獲取食譜按讚狀態和計數
router.get('/api/likes/:id', async (req, res) => {
    try {
        const recipeId = req.params.id;

        // 獲取總按讚數
        const [likeCount] = await db.query(
            'SELECT like_count FROM recipes WHERE id = ?',
            [recipeId]
        );

        // 如果有登入用戶，檢查該用戶是否按讚
        let userLikeStatus = false;
        if (req.my_jwt) {
            const [userLike] = await db.query(
                'SELECT is_like FROM user_feedbacks WHERE recipes_id = ? AND user_id = ?',
                [recipeId, req.my_jwt.user_id]
            );
            userLikeStatus = userLike.length > 0 ? userLike[0].is_like === 1 : false;
        }

        res.json({
            success: true,
            likeCount: likeCount[0].total_likes,
            userLiked: userLikeStatus
        });

    } catch (error) {
        console.error('獲取按讚狀態失敗:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新食譜按讚狀態 - 修改路由參數和處理邏輯
router.post('/api/likes/:id', async (req, res) => {  // 修改路由格式
    try {
        // 驗證登入狀態
        if (!req.my_jwt) {
            return res.status(401).json({ 
                success: false, 
                error: "請先登入才能按讚" 
            });
        }

        const recipeId = req.params.id;  // 從 URL 參數獲取 recipeId
        const userId = req.my_jwt.user_id;
        const { isLike } = req.body;

        // 開始資料庫交易
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 檢查是否已有按讚記錄
            const [existingFeedback] = await connection.query(
                'SELECT id, is_like FROM user_feedbacks WHERE recipes_id = ? AND user_id = ?',
                [recipeId, userId]
            );

            if (existingFeedback.length > 0) {
                // 更新現有記錄
                await connection.query(
                    'UPDATE user_feedbacks SET is_like = ? WHERE recipes_id = ? AND user_id = ?',
                    [isLike ? 1 : 0, recipeId, userId]
                );

                // 如果是從不喜歡變成喜歡，或從喜歡變成不喜歡，需要更新 recipes 表的 like_count
                if (existingFeedback[0].is_like !== (isLike ? 1 : 0)) {
                    await connection.query(
                        'UPDATE recipes SET like_count = GREATEST(like_count + ?, 0) WHERE id = ?',
                        [isLike ? 1 : -1, recipeId]
                    );
                }
            } else {
                // 創建新記錄
                await connection.query(
                    'INSERT INTO user_feedbacks (recipes_id, user_id, is_like, created_at) VALUES (?, ?, ?, NOW())',
                    [recipeId, userId, isLike ? 1 : 0]
                );

                // 如果是按讚，更新 recipes 表的 like_count
                if (isLike) {
                    await connection.query(
                        'UPDATE recipes SET like_count = like_count + 1 WHERE id = ?',
                        [recipeId]
                    );
                }
            }

            // 提交交易
            await connection.commit();

            // 重新計算按讚總數
            const [updatedCount] = await db.query(
                'SELECT COALESCE(like_count, 0) as like_count FROM recipes WHERE id = ?',
                [recipeId]
            );

            res.json({
                success: true,
                message: isLike ? "已按讚" : "已取消讚",
                likeCount: updatedCount[0]?.like_count || 0
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('更新按讚狀態失敗:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 新增食譜
router.post('/api',async(req,res)=>{
    const { title, description, cook_time, servings, user_id } = req.body;

    try{
        const [result] = await db.query('INSERT INTO recipes SET ?', [title, description, cook_time, servings, user_id]);
        res.json({ success: true, insertedId: result.insertId });
    }catch(error){
        res.status(500).json({ success: false, error:error.message });
    }
});

// 更新食譜
router.put('/api/:id',async(req,res)=>{
    const { title, description, cook_time, servings, user_id } = req.body;

    try{
        const [result] = await db.query('UPDATE recipes SET title=?, description=?, cook_time=?, servings=?, user_id=?, updated_at=NOW() WHERE id=?', [{ title, description, cook_time, servings, user_id }, req.params.id]);
        res.json({ success: !!result.affectedRows });
    }catch(error){
        res.status(500).json({ success: false, error:error.message });
    }
});

//刪除食譜
router.delete('/api/:id',async(req,res)=>{
    try{
        const [result] = await db.query('DELETE FROM recipes WHERE id=?', [req.params.id]);
        res.json({ success: !!result.affectedRows });
    }catch(error){
        res.status(500).json({ success: false, error:error.message });
    }
});

export default router;