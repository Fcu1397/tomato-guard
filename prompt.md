你是一位資深 Chrome Extension 工程師。請基於我現有的 Vue 3 + Vite + TypeScript 專案，
建立一個名為「Focus Forge」的 Chrome Extension（Manifest V3）。

我已經有基本的 Vue + Vite 專案結構，請幫我：

1. 調整成 Chrome Extension 架構
2. 實作核心 MVP 功能
3. 提供完整可運行的程式碼

## 需要產出的檔案：

### 核心配置
- manifest.json (MV3)
- vite.config.ts (多入口配置)
- 各入口的 HTML 檔案

### 功能模組
- background/service-worker.ts（狀態機、計時器）
- popup/（Vue 番茄鐘 UI）
- content/inject.ts（休息 Overlay）
- options/（設定頁面）
- shared/（工具函數）

### MVP 功能
1. 番茄鐘計時（25/5 分鐘）
2. 強制休息 Overlay
3. 密碼保護（PBKDF2）
4. 假藍屏破壞模式
5. Canvas 煙火特效

請提供完整、可直接運行的程式碼，包含詳細註解。

"先給我 manifest.json 和 vite.config.ts"
"接著給我 background 相關檔案"
"再給我 popup 的完整程式碼"