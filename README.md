# Food0425

*** 處理BUG ***
遇到的問題
* MAC的安裝一開始要用ＨＯＭＥＢＲＥＷ去做安裝腳本語言
1. ＭＹＳＱＬ的安裝設定密碼時登不進去？
直接重灌而且要將檔案完全刪除乾淨，ＷＯＲＫＢＥＮＣＨ是ＭＹＳＱＬ的圖形程式，可以直接不用透過ＴＥＲＭＩＮＡＬ直接圖形化介面操作，之後匯入套件
2. mac的node.js套件會自動安裝最新版23.0，但會造成套件版本衝突所以要使用NVM套件控制版本降到20
3. 使用vscode的外掛套件database可將資料庫資料表格化對應通訊阜3306,本機位置127.0.0.12的端口
4. apache跟homebrew是會衝突的
5. 推送在分支git push origin food_Kris
6. 遇到git認證問題解決
清除舊憑證：git credential-osxkeychain erase
生成新的 Token：需要在 GitHub 上創建 Personal Access Token。
推送時使用 Token：用生成的 PAT 代替密碼進行身份驗證。