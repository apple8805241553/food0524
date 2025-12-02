# Food0425

**\* 處理BUG \*\***
遇到的問題
MAC的安裝一開始要用ＨＯＭＥＢＲＥＷ去做安裝腳本語言
ＭＹＳＱＬ的安裝設定密碼時登不進去？
直接重灌而且要將檔案完全刪除乾淨，ＷＯＲＫＢＥＮＣＨ是ＭＹＳＱＬ的圖形程式，可以直接不用透過ＴＥＲＭＩＮＡＬ直接圖形化介面操作，之後匯入套件
mac的node.js套件會自動安裝最新版23.0，但會造成套件版本衝突所以要使用NVM套件控制版本降到20
使用vscode的外掛套件database可將資料庫資料表格化對應通訊阜3306,本機位置127.0.0.12的端口
apache跟homebrew是會衝突的
顯示在檔案名稱[---]中括號是動態路由－－》會去抓取資料庫的ＩＤ
prettier套件運行問題？
-->"prettier.configPath": ".prettierrc.json"以vsCodeˇˇ的setting.json根目錄運行
但此專案是以node.modules的套件也就是套件是基於node.modules的套件下去做運行
所以
-->"prettier.configPath": ".prettierrc.json"要修改成
"prettier.prettierPath": "./node_modules/prettier" 來除錯

在react裡面製作ＡＰＩ的時後不可以把const在寫變數<--不合邏輯
const app ={...`{$...}`}錯誤
Clint ----- Server ----- MYSQL 發送ＡＰＩ請求
Clint request請求(通常是使用Fetchc或或)--> Server

**05/13**
新增顯示產品列表ＡPI：
遇見問題->沒抓到資料用fetch的方式因為前後端檔案名稱不一樣'products,prouduct'一開始先檢查F12的network確定狀態是 500 or 404 前端要確定有沒有正確送出請求，後端檢查路由是否有對上名稱，而後端ＡＰＩ路由的路徑系統是‘／’為根路徑代筆index.js的路由第一層如果我寫router.get(./api)表示是/『api（第一層）』/api（第二層）所以顯示上以“/”為主

重點整理：
通常ＡＰＩ回傳跟渲染是兩回事，回傳回來的東西要去定義，所以先確認data裡面的物件
{
food:true
[
XXX
XXX -- Json格式 --
XXX -- 中括號都是包裹陣列 --
]
}
-- 大括號包裹物件 --
專案裡面得是data.row所以要去確認
map裡面的渲染要特別注意如果不想讓他特別報錯，就可以使用？這樣有問題不會直接報錯，不建議常用

-- 點擊ProductCard組件的時候，導向products/[id]動態路由進入商品詳細頁 --
－－》他直接導向一個沒有意義的頁面

可以有一隻ＡＰＩ同時有分類、搜尋、排序、分頁的功能嗎？
可以這是常見的做法，稱為 複合查詢 API（compound query API） 或 RESTful query filtering。

那可以寫一隻ＡＰＩ就達到我要的功能呢？可以
一隻彈性高、接受多參數的 API 端點。這個端點可以根據不同的 API 請求 (Request) 回傳不同的資料回應 (Response)。當你的前端頁面需要顯示多個不同篩選的資料清單時，你需要向這個同一個 API 端點發送多個 API 請求，每個請求帶有該清單所需的特定參數。前端接收到多個回應後，才能條件式地將對應的資料渲染到頁面上的不同位置。

queryParms與searchParms差別？

### 05/16
確定結構是否可行再請ＡＩ生成

在檔案開頭加入 API 基礎網址常數
const API_BASE_URL = 'http://localhost:3001/products'
在路由結構下product/api可以使用基礎常數不使用變數，可以解決不管怎麼樣底層渲染就是長這樣

設定function之前，宣告const,let,{}包裹物件,[]包裹陣列
{}參數可以設定物件回傳形式
要偵測錯誤的話不可以把console.log放在return function裡面
ＡＰＩ有成功渲染
錯誤跟找不到是兩回事

### 05/19
重整思路：
新增ＡＰＩ功能時要利用開發者工具人尋找出相關對應介面，
不用刻意釐清是否是前後端問題，因為錯誤是來自於整體結構，在console.log上面做的多一點可以更清楚錯誤是來自於哪裡，Ｆ12裡面的paylow是我寄送ＡＰＩ到後端的規範型式，大致了解架構並且確認狀態是200.404.500去找出狀態，可以去利用錯誤節點除錯（適合後端），
前端react部份：
確認一開始的定義狀態：是否宣告？是否使用？ usestate部份，去思考介面渲染有幾種狀態
作用域變數：const內容？位置有沒有放對？建議使用cmd+f配合，寫法問題（可詢問ＡＩ結構）
下面宣告使用得值classname有沒有問題
後端node.js部份：
路由結構是否正確？ＳＱＬ語法有沒有正確其次對應鍵位（{keyboard}）位置正確？
