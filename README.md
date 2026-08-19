# FrisbeeTraining

一個最簡單的 Ultimate Frisbee 訓練影片整理網站。

## 檔案

- `index.html`：網站結構
- `style.css`：外觀
- `videos.js`：影片資料，平常主要修改這裡
- `app.js`：篩選、搜尋、timestamp 等功能

## Local 打開

最簡單可以直接雙擊 `index.html`。

更推薦在 VS Code 安裝 **Live Server** extension，然後：

1. 右鍵 `index.html`
2. 選 `Open with Live Server`

## 新增影片

打開 `videos.js`，複製一筆資料：

```js
{
  id: 4,
  title: "4v4 第一組 vs 第二組",
  date: "2026-08-20",
  format: "4v4",
  group: "第一組 vs 第二組",
  players: ["Johnny", "Ted", "Richard"],
  youtubeId: "你的 YouTube Video ID",
  notes: [
    {
      time: 42,
      text: "這裡寫註解"
    }
  ]
}
```

YouTube 網址如果是：

`https://www.youtube.com/watch?v=abcdefghijk`

那 `youtubeId` 就是：

`abcdefghijk`

## GitHub Pages

GitHub repo：

1. Settings
2. Pages
3. Source → Deploy from a branch
4. Branch → `main`
5. Folder → `/ (root)`
6. Save

之後每次 push 到 GitHub，網站就會更新。
