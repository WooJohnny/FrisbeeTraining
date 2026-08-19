# FrisbeeTraining

Ultimate Frisbee 訓練影片整理網站，使用純 HTML / CSS / JavaScript，可直接部署到 GitHub Pages。

## 這一版新增的功能

- 首頁顯示 `＋ 新增影片` 按鈕
- 按下後才展開建立影片表單
- 建立成功、取消或關閉後會收起表單

### 建立影片

網站最上方有「建立影片」表單。

共通欄位：

- YouTube 連結
- 日期
- 影片標題
- 類別
  - 體能
  - Drill
  - 對抗
- 哪些成員

### 成員

可以：

- 從既有成員選擇
- 新增成員

新增成員有兩個欄位：

- 名字
- 性別

顏色：

- 男性：藍色
- 女性：紅色

新增後會直接進入成員清單以及 Filter。

### 對抗

選擇「對抗」後才會出現：

- 2v2
- 3v3
- 4v4
- 5v5
- 組別 / 對戰

預設組別：

- 第一組
- 第二組
- 第三組
- 第四組
- 第五組
- 第六組
- 第一組 vs 第二組

也可以自己新增，例如：

- 第三組 vs 第四組
- A 組
- B 組

### Drill

選擇「Drill」後可以：

- 選既有 Drill
- 建立新 Drill

建立 Drill 需要：

- Drill 名字
- Drill 描述
- Drill 次數

建立後會加入 Drill 清單，之後其他影片可以直接選。

### 未整理影片

`videos.js` 的 `unsortedVideos` 會顯示在「未整理影片」。

按：

`整理這支影片`

網站會自動把：

- YouTube
- 日期
- 原標題

帶到「建立影片」表單。

儲存成功後，該影片會從未整理區消失。

## 檔案

- `index.html`：頁面結構
- `style.css`：樣式
- `videos.js`：預設成員 / Drill / 影片 / 未整理影片
- `app.js`：互動、建立、分類與 Filter

## Local 測試

建議用 VS Code 的 Live Server：

1. 打開 `FrisbeeTraining`
2. 右鍵 `index.html`
3. `Open with Live Server`

## GitHub Pages

1. Push 到 GitHub
2. Repo → Settings
3. Pages
4. Deploy from a branch
5. `main`
6. `/ (root)`

## 現在的資料保存限制

這仍然是純 GitHub Pages 版本。

使用者透過網頁新增的：

- 成員
- Drill
- 組別
- 影片

目前存在瀏覽器 `localStorage`。

所以：

- 同一台電腦 / 同一瀏覽器：會保留
- 不同使用者：不會同步
- 不同手機 / 電腦：不會同步

如果要讓 Ted、Johnny、Richard 等人一起建立與分類同一份資料，下一階段建議接 Supabase。
