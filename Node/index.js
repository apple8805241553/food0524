import express from "express";
import upload from "./utils/upload-imgs.js";
import admin2Router from "./routes/admin2.js";
import abRouter from "./routes/address-book.js";
import session from "express-session";
import moment from "moment-timezone";
import mysql_session from "express-mysql-session";
import cors from "cors";
import db from "./utils/connect-mysql.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 設定連到食譜的路由
import recipesRouter from "./routes/recipes.js";
// 設定連到商城的路由
import productsRouter from "./routes/products.js";
// 設定連到使用者的路由
import usersRouter from "./routes/users.js";
// 設定連到評價的路由
import reviewRouter from "./routes/products-review.js";
// 設定到餐廳詳細頁面的路由
import restaurantsRouter from "./routes/restaurants.js";
// 設定到購物車的路由
import cartRouter from "./routes/cart.js";
// 設定到聯絡我們的路由
import contactRouter from "./routes/contact.js";
// 設定到訂單頁面的路由
import orderRouter from "./routes/order.js";
// 設定會員註冊的路由
import registerRouter from "./routes/register.js";
// 設定EC-Pay的路由
import paymentRouter from "./routes/ecpay-test-only.js";
// 設定line-pay的路由
import linePayTestRouter from "./routes/line-pay-test-only.js";
// 設定上傳大頭貼圖片的路由
import uploadAvatarsRouter from "./routes/upload-avatars.js";
// 設定orderItems的路由
import orderItemsRouter from "./routes/orderItems.js";
// 設定我的收藏的路由
import favoritesRouter from "./routes/favorites.js";
// 設定忘記密碼驗證相關的路由
import authRouter from "./routes/auth.js";

const MySQLStore = mysql_session(session);
const sessionStore = new MySQLStore({}, db);

const app = express();

app.set("view engine", "ejs");

// json web token
app.get("/jwt-sign", (req, res) => {
  const data = {
    id: 26,
    account: "Bang",
  };
  const token = jwt.sign(data, process.env.JWT_KEY);
  res.send(token);
});

app.get("/jwt-verify", (req, res) => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsImFjY291bnQiOiJTaGluZGVyIiwiaWF0IjoxNzQ1OTA4NTU5fQ.LXGvFMNVwMYaHna-ysR7aju5zikDVs5LEWrgaoAjGKE";
  const payload = jwt.verify(token, process.env.JWT_KEY);
  res.json(payload);
});

app.post("jwt-verify", (req, res) => {});

// *** 設定靜態內容資料夾
app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// *** 設定session
app.use(
  session({
    saveUninitialized: false, // 未建立session時，不儲存(不建立)未初始化的session
    resave: false, //內容未變更時，是否要強制回傳
    secret: "secret",
    store: sessionStore,
  })
);

// --- JWT Token 處理 ---
app.use((req, res, next) => {
  res.locals.title = "網頁";
  res.locals.pageName = "";
  res.locals.session = req.session; // 讓ejs可以取得session
  res.locals.originalUrl = req.originalUrl;

  // 處理 JWT 取得 Token
  const authHeader = req.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      // 將解碼後的 token 存到 req.my_jwt 供後續路由使用
      req.my_jwt = jwt.verify(token, process.env.JWT_KEY);
    } catch (ex) {
      // Token 無效或過期，req.my_jwt 會是 undefined
      console.log("JWT 驗證失敗:", ex.message);
    }
  }
  next();
});
// --- JWT Token 處理結束 ---

// Top-level middlewares
app.use(express.json()); // <-- 處理 JSON 請求 body
app.use(express.urlencoded({ extended: true }));
// 連到食譜
app.use("/recipes", recipesRouter);
// 連到商城
app.use("/products", productsRouter);
// 連到會員中心相關
app.use("/users", usersRouter);
// 連到上傳大頭貼圖片 (掛載在 /users 路徑下)
app.use("/users", uploadAvatarsRouter);
// 連到評價
app.use("/products-review", reviewRouter);
// 連到餐廳詳細頁面
app.use("/restaurants", restaurantsRouter);
// 連到購物車
app.use("/cart", cartRouter);
// 連到聯絡我們
app.use("/contact", contactRouter);
// 連到訂單頁面
app.use("/api/orders", orderRouter);
// 連到會員註冊
app.use("/register", registerRouter);
// 連到 EC-PAY 頁面
app.use("/api/ecpay-test-only", paymentRouter);
// 連到 line-pay 頁面
app.use("/api/line-pay-test-only", linePayTestRouter);
// 連到order-items 路徑
app.use("/api/order-items", orderItemsRouter);
// 連到我的收藏
app.use("/api/favorites", favoritesRouter);
// 連到忘記密碼等驗證相關，所有 /api/auth/xxx 的請求會由 auth.js 處理
app.use("/api/auth", authRouter);

// 路由定義, 兩個條件: 1. 拜訪的 HTTP 方法, 2. 路徑
app.get("/", (req, res) => {
  // res.send(`<h1>Hello World</h1>`);
  res.locals.title = "網頁" + res.locals.title;
  res.locals.pageName = "json-sales";
  res.render("home", { name: "Shinder" });
});

app.get("/json-sales", (req, res) => {
  const sales = [
    { name: "Bill", age: 28, id: "A001" },
    { name: "Peter", age: 32, id: "A002" },
    { name: "Carl", age: 29, id: "A003" },
  ];
  res.render("json-sales", { sales });
});

app.get("/try-qs", (req, res) => {
  res.json(req.query);
});

app.get("/try-post-form", (req, res) => {
  res.render("try-post-form");
});

app.post("/try-post-form", (req, res) => {
  res.render("try-post-form", req.body);
});

app.post("/try-post", upload.none(), (req, res) => {
  res.json(req.body);
});

app.post("/try-upload", upload.single("avatar"), (req, res) => {
  res.json({
    file: req.file,
    body: req.body,
  });
});

app.post("/try-uploads", upload.array("photos"), (req, res) => {
  res.json(req.files);
});

app.get("/my-params1/abc", (req, res) => {
  res.json({ page: "abc" });
});

// 動態路由
app.get("/my-params1/:action?/:id?", (req, res) => {
  res.json(req.params);
  console.log(req.params);
});

app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/, (req, res) => {
  let u = req.url.split("?")[0]; // 排除 query string 參數
  u = u.slice(3); // 略過前面的三個字元
  u = u.split("-").join("");
  res.json({ u });
});

app.use("/address-book", abRouter);
app.use("/admins", admin2Router);

// 測試 Session
app.get("/try-sess", (req, res) => {
  req.session.my_num = req.session.my_num || 0;
  req.session.my_num++;

  res.json(req.session);
});

///使用moment.js
app.get("/try-moment", (req, res) => {
  const fm = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment(); // 當下時間
  const m2 = moment("2024-02-29");
  const m3 = moment("2023-02-29");

  res.json({
    m1: m1.format(fm),
    m2: m2.format(fm),
    m3: m3.format(fm),
    m1v: m1.isValid(),
    m2v: m2.isValid(),
    m3v: m3.isValid(),
    m1z: m1.tz("Europe/London").format(fm),
    m2z: m2.tz("Europe/London").format(fm),
  });
});

app.get("/yahoo", async (req, res) => {
  const r = await fetch("https://tw.yahoo.com/");
  const txt = await r.text();
  res.send(txt);
});

app.get("/try-db", async (req, res) => {
  const sql = "SELECT * FROM address_book LIMIT 3";
  // rows 是我們要查詢的資料, fields 欄位定義相關訊息
  const [rows, fields] = await db.query(sql);
  res.json({ rows, fields });
});

const strSchema = z.string();
const loginSchema = z.object({
  email: z.string({ message: "email 必填" }).email({ message: "email 格式不符合" }),
  password: z.string({ message: "password 必填" }).min(6, { message: "密碼長度至少 6 個字元" }),
});

app.get("/try-zod1", async (req, res) => {
  res.json(strSchema.safeParse("abc"));
});
app.get("/try-zod2", async (req, res) => {
  res.json(strSchema.safeParse(123));
});
app.get("/try-zod3", async (req, res) => {
  // http://localhost:3001/try-zod3?email=shin@test.com&password=1234567
  res.json(loginSchema.safeParse(req.query));
});

// 密碼轉換
app.get("/bcrypt/:password?", async (req, res) => {
  const password = req.params.password || "123456";

  const str = await bcrypt.hash(password, 10);
  res.send(str);
});
app.get("/bcrypt", async (req, res) => {
  const hash = "$2b$10$qltnSe08WfcsPBMCvW7AL.4bFUcrNEdCyPoYoLuuKS1SzWxJ0Anua";
  const result = await bcrypt.compare("123456", hash);
  res.json({ result });
});

// 登入表單
app.get("/login", async (req, res) => {
  if (req.session.admin) {
    // 已經登入時jwt-lo不要跳轉到這個頁面
    return res.redirect("/");
  }
  res.locals.title = "登入 - " + res.locals.title;
  res.locals.pageName = "login";
  res.render("login");
});

// 登出功能
app.get("/logout", async (req, res) => {
  delete req.session.admin;
  req.session.save((error) => {
    if (req.query.bt) {
      res.redirect(req.query.bt);
    } else {
      res.redirect("/");
    }
  });
});

// 處理登入功能，回應 JWT token
app.post("/jwt-login", upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    code: 0,
    data: {
      user_id: "",
      email: "",
      username: "",
      token: "",
      full_name: "",
      profile_picture_url: "",
    },
  };

  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (!email || !password) {
    output.code = 400; // 輸入不完整
    return res.json(output);
  }

  const sql = "SELECT * FROM users WHERE email=?";
  const [rows] = await db.query(sql, [email]);
  if (!rows.length) {
    output.code = 402; // 帳號錯誤
    return res.json(output);
  }

  // 檢查資料庫結構，password_hash 欄位是否存在
  if (!rows[0].password_hash) {
    output.code = 500; // 內部錯誤，例如資料庫結構不符
    output.error = "伺服器內部錯誤，無法驗證密碼";
    console.error("User object missing password_hash:", rows[0]);
    return res.json(output);
  }

  // 驗證密碼
  const result = await bcrypt.compare(password, rows[0].password_hash);
  if (!result) {
    output.code = 405; // 密碼錯誤
    return res.json(output);
  }

  // 帳密驗證成功 (注意：payload 不應包含過多或敏感資訊)
  const payload = {
    user_id: rows[0].user_id,
    email: rows[0].email,
  };
  const token = jwt.sign(payload, process.env.JWT_KEY); // 確認 JWT_KEY 已在環境變數設定

  // 回傳給前端的使用者資料 (前端 AuthContext 或會員中心頁面需要顯示的欄位)
  output.data = {
    token,
    user_id: rows[0].user_id,
    email: rows[0].email,
    username: rows[0].username,
    full_name: rows[0].full_name,
    phone_number: rows[0].phone_number,
    birthday: rows[0].birthday ? moment(rows[0].birthday).format("YYYY-MM-DD") : null,
    gender: rows[0].gender,
    address: rows[0].address,
    registration_date: rows[0].registration_date,
    profile_picture_url: rows[0].profile_picture_url || "",
  };

  output.code = 200;
  output.success = true;

  res.json(output);
});

// 用來測試 token
app.get("/jwt-data", (req, res) => {
  res.json(req.my_jwt);
});

app.get("/cate1", async (req, res) => {
  const sql = "SELECT * FROM categories ORDER BY category_id DESC";
  const [rows] = await db.query(sql);
  res.json(rows);
});

app.get("/cate2", async (req, res) => {
  const sql = "SELECT * FROM categories";
  const [rows] = await db.query(sql);
  const first = [];
  for (let i of rows) {
    if (!i.parent_id) {
      // 取得第一層的資料
      first.push(i);
    }
  }
  for (let f of first) {
    for (let r of rows) {
      if (f.category_id == r.parent_id) {
        f.children ||= []; // 確保是一個陣列
        f.children.push(r);
      }
    }
  }
  res.json(first);
});

// 可處理多層
app.get("/cate3", async (req, res) => {
  const sql = "SELECT * FROM categories";
  const [rows] = await db.query(sql);
  const dict = {}; // 對應的結構
  for (let r of rows) {
    dict[r.category_id] = r;
  }

  for (let r of rows) {
    if (r.parent_id) {
      // 找到該項目的父項
      const parent = dict[r.parent_id];
      parent.children ||= [];
      parent.children.push(r);
    }
  }
  res.json(rows.filter((v) => !v.parent_id));
});

// 導入到 React 的前端區塊
app.use(express.static("build"));

// 當前端的 React App 沒有找到對應的 API 路由時，會導向這個全域的路由
app.get("*", (req, res) => {
  res.send(
    `<!doctype html><html lang="zh"><head><meta charset="utf-8"/><link rel="icon" href="/favicon.ico"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Shinder react hooks"/><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"/><title>Shinder react hooks</title><script defer="defer" src="/static/js/main.6a205622.js"></script></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>`
  );
});

// 自訂路由, 都放在 404 設定之前
// ************ 404 頁面 ************
app.use((req, res) => {
  res.status(404).send(`<h1>您走錯路了</h1>`);
});

const port = process.env.WEB_PORT || 3001;

app.listen(port, () => {
  console.log(`Express Server 啟動: ${port}`);
});
