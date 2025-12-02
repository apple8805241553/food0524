// Node/utils/authenticateToken.js
// 供 favorites.js 使用此中介軟體，用來驗證 JWT (功能與 routes/users.js 取得單一會員資料 API 相同)

import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.get('Authorization'); // 或者 req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, error: '未經授權：缺少或格式錯誤的 Token' });
  }

  const token = authHeader.slice(7); // 移除 "Bearer " 前綴

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY); // 使用與簽發時相同的密鑰
    
    // 將解碼後的 payload 附加到 req 物件上，方便後續路由使用
    // decoded 將包含 { user_id: XXX, email: '...', ... } 等你在簽發 token 時放入的資訊
    req.user = decoded; 
    
    next(); // Token 有效，繼續處理請求
  } catch (error) {
    console.error('JWT 驗證錯誤:', error.name, error.message);
    // 根據錯誤類型給予更明確的回應
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: '未經授權：權杖已過期', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: '未經授權：權杖無效', code: 'INVALID_TOKEN' });
    }
    // 其他可能的 jwt 錯誤
    return res.status(401).json({ success: false, error: '未經授權：權杖驗證失敗', code: 'TOKEN_VERIFICATION_FAILED' });
  }
};

export default authenticateToken;