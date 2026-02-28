# Daily Digest 1.0 (GitHub Pages)

这是用于发布到独立 GitHub Pages 仓库的静态站点目录。

## 功能

- 双 Tab：`YouTube` / `Apps`
- 最近 7 天日期切换
- 纯静态页面（不依赖运行时后端）

## 数据来源

由根目录脚本导出：

```bash
npm run export:pages-1.0
```

会生成：

- `pages/daily-digest-1.0/data/digest.json`

> `Apps` Tab 当前映射为现有系统中的 **X 日报摘要**（仅保留分类与摘要文本，不含 Prompt / 管理信息）。

若已配置 `PAGES_SYNC_*` 环境变量，可直接执行：

```bash
npm run sync:pages-1.0
```

## 发布到独立仓库

将本目录全部文件同步到独立仓库根目录（当前：`ai-digest-1.0-archive`）后，启用该仓库 GitHub Pages（`main` 分支 `/` 根目录）即可。
