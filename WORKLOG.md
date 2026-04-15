# WORKLOG

Last updated: 2026-04-10

## Current status

- UI 全面现代化重构已完成并推送至 GitHub（submodule + monorepo 均已更新）。
- 生产部署待 VPS 手动拉取并重建（见下方部署说明）。

---

## 2026-04-10 — UI 现代化重构（全量）

### 背景

原 UI 使用 `98.css`（Win98 风格），与 portal 整体设计语言不一致。本次按设计规范（`docs/superpowers/plans/2026-04-10-ama-listing-creator-redesign.md`）全量重构三个主页面。

### 变更详情

**Listings 页面（`ListingsClient.tsx`）**
- 重写为现代卡片 + 表格布局，右侧 detail panel 显示图片预览、字段信息及操作按钮
- 新增 ReadinessBadge 组件（红/黄/绿三态）
- 新增按款式分组的 filter pills，支持每个款式独立导出
- 新增导出前检查弹窗（ExportReadinessModal），列出每个变体的必填/建议字段状态
- 修复：补回 `库存` 字段显示（曾因重构遗漏）

**Editor 页面（`EditorClient.tsx` + `editor/page.tsx`）**
- 字段区改为 field-card 分组（必填基本信息 / 建议内容 / 规格+图片）
- 右侧 panel 新增完整度仪表（必填/建议进度条）+ 关键词建议 + 标题预览
- 新增 ◀ ▶ SKU 上下翻页导航（toolbar 中，显示当前序号/总数）
- `editor/page.tsx` 改为始终读取 `listings.json` 以提取 `allSkus` 列表

**Images 页面（`ImagesClient.tsx`）**
- 从 8 格 Win98 表格改为 7 槽现代 grid（SLOT_LABELS: Main/Side/3/4/Detail/On-model/Infographic/Lifestyle）
- 槽位定义：SLOT 0 主图带额外规格提示，其余默认要求
- 新增「Remove Image」按钮（detail panel 中，仅在槽有图片时显示）
- 移除 VideoSection 和 SpecsSection（不在新规范内）
- DimensionsSection 全量保留（canvas 绘图、模板选择、下载逻辑），仅将内联样式常量替换为 CSS 类名
- 修复：canvas context 空指针（`getContext('2d')` 改为 null-check）
- 修复：`img.onerror` 缺失导致图片加载失败时 canvas 渲染链断裂

**CSS（`globals.css`）**
- 移除 `98.css` 依赖
- 新增 `.img-slot`, `.img-slot-grid`, `.slot-filled`, `.slot-empty`, `.slot-selected`, `.slot-num`, `.slot-check`, `.slot-label`, `.color-group-header`, `.color-swatch` 等图片相关类

### Git 提交记录（submodule）

```
e86d33e feat(ama-listing-creator): add prev/next SKU navigation to Editor toolbar
c9dbd02 fix(ama-listing-creator): add Remove Image button to image slot detail panel
92af82a chore(ama-listing-creator): remove 98.css dependency
4cdbd62 fix(ama-listing-creator): add canvas context null-check and onerror handler in DimensionsSection
6a91355 feat(ama-listing-creator): modernize Images page — 7 slots, modern grid
5bd1290 feat(ama-listing-creator): modernize Editor page — field cards, completeness panel
f2f4144 fix(ama-listing-creator): restore 库存 field in listings detail panel
79dffba feat(ama-listing-creator): modernize Listings page — table, filters, detail panel
```

### VPS 部署（待执行）

```bash
cd /root/portal-system
git pull origin main
git submodule update --remote apps/ama-listing-creator
cd apps/ama-listing-creator
npm install
npm run build
pm2 restart ama-listing-creator   # 或 systemctl restart，视服务名而定
```

---

## 历史记录

### 2026-04-08

- The main portal now has a reserved entry point for this app under `/apps`.
- Main system repository migration clarified that this app is separate from the platform root repository.

## Next likely work

- VPS 部署：执行上方部署命令，验证三个页面在生产环境正常运行。
- 确认 `image8` 字段（FormData 中保留，CSV 导出用，UI 不渲染）是否需要在 Images 页面补充第 8 槽。

## Important references

- `apps/ama-listing-creator/next.config.ts`
- `modules/amazon-cleaner/scripts/templates/apps.html`
- `docs/superpowers/plans/2026-04-10-ama-listing-creator-redesign.md`
- `PROJECT_STATUS.md`
