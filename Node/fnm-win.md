# 在 Windows 上使用 fnm

## 安裝 fnm

```sh
# 安裝 fnm
winget install Schniz.fnm

# 關掉 PowerShell 視窗再重開
fnm --version # 查看版本

# 安裝 node 版本
fnm install 20
```

## 查看 profile 檔

```sh
echo $PROFILE
# C:\Users\iSpan\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
```

## 建立 profile 檔

```sh
# 在 profile 檔最後放入下行
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
```

## 設定 profile 檔案的權限

```sh
# 以系統管理員的身份啟動 PowerShell, 再執行下行
set-ExecutionPolicy RemoteSigned

# 詢問時回答 Y (Yes) 或 A (All)
```

## 重啟 PowerShell

```sh
# 查看 nodejs 版本
node -v 
```