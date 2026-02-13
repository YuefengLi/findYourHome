# findYourHome

杭州置换买房信息系统，当前实现 `Phase 1`：小区数据的静态展示与对比。

## 目录结构

```text
data/communities/       # 小区 YAML 数据
assets/communities/     # 图片资源（封面、图集）
site/                   # Astro 站点源码
```

## 本地开发

环境要求：

- Node.js `>= 18.20.8`（推荐 Node 22）
- npm `>= 9.6.5`

命令：

```bash
cd site
npm install
npm run dev
```

构建：

```bash
cd site
npm run build
```

说明：

- 构建时会先执行 `site/scripts/prepare-assets.mjs`，把 `../assets` 复制到 `site/public/assets`。
- 构建阶段会校验 `data/communities/*.yml`，不合法会直接失败。

## 页面说明（Phase 1）

- `/communities`：小区列表，支持筛选、排序、勾选对比（2-6 个）
- `/communities/<slug-or-id>`：小区详情
- `/compare`：对比页（支持 URL 参数 `?ids=100001,100002` 覆盖 localStorage）

## 数据录入规范（关键）

每个小区一个 YAML 文件，至少包含以下必填字段：

- `id`
- `name_zh`
- `tags`（数组）
- `updated_at`（`YYYY-MM-DD`）

强校验规则：

- `tags` 必须是数组
- `updated_at` 必须符合 `YYYY-MM-DD`
- `housing_stock.building_types[].layouts[].area_sqm_range` 只能是：
  - `80-90`
  - `90-100`
  - `100-120`

错误会输出：文件名 + 字段路径 + 原值。

示例数据：

- `data/communities/sample-binjiang-xx.yml`

## GitHub Pages 部署

已配置工作流：`.github/workflows/deploy-pages.yml`

- 触发：push 到 `main`
- 流程：checkout -> setup Node -> install -> build -> upload artifact -> deploy pages
- 构建使用 Node 22

## 常见问题

1. 本地构建提示 Node 版本不支持  
升级到 Node `>=18.20.8`，推荐直接使用 Node 22。

2. 图片不显示  
确认 YAML 里的图片路径为相对 `assets` 的路径（例如 `../assets/communities/<slug>/cover.jpg`），并且文件存在。
