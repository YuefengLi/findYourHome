# 设计文档 v1（Codex 用，仅 Phase 1）

> 目标：实现小区信息的静态站（列表/详情/对比）  
> 范围：只做 Phase 1；若未来大改，另出 v2 设计文档

---

## 1. Phase 1 目标

从仓库 `/data/communities/*.yml` 读取小区数据，生成静态页面：

- 小区列表页：`/communities`
- 小区详情页：`/communities/<slug-or-id>`
- 对比页：`/compare`

并实现：

- tag 筛选 + 若干字段筛选（存在字段则启用）
- 字段排序
- 勾选对比（2–6 个）
- 基础图表（不引入评分体系）
- 移动端优先（responsive）
- GitHub Actions 自动 build & deploy 到 GitHub Pages

---

## 2. 技术栈（固定）

- SSG：**Astro**
- UI：React + **MUI**
- 图表：**ECharts**
- 数据：构建期 Node 解析 YAML
- 部署：GitHub Pages
- CI/CD：GitHub Actions（push main 自动部署）
- 对比选择状态：localStorage + URL 参数恢复

---

## 3. 仓库目录结构（固定）

```
/data/
  /communities/
    <file>.yml
/assets/
  /communities/
    <id-or-slug>/
      cover.jpg
      1.jpg
/site/
  (Astro 项目源码)
```

---

## 4. Community YAML Schema（v1.1）

### 4.1 必填字段（构建期强校验）
- `id`
- `name_zh`
- `tags`（数组）
- `updated_at`（YYYY-MM-DD）

### 4.2 字段结构（允许缺失）
```yml
id: 100001
slug: binjiang-xx
name_zh: "滨江XX花园"
alias: ["XX花园"]

city: "杭州"
district: "滨江"
area: "长河/白马湖"
address_brief: "..."

tags: ["地铁", "次新", "改善"]

links:
  - title: "贝壳小区页"
    url: "https://..."
  - title: "小程序链接"
    url: "weixin://..."

build:
  build_year_range: "2010-2014"
  property_type: "住宅"
  developer: ""
  property_mgmt_company: ""

price:
  level: "偏高"
  ref_wan_per_sqm: 5.8
  ref_total_wan_range: "450-650"

# 距离口径：步行导航距离（米）
distance:
  metro:
    - line: "6号线"
      station: "XXX"
      distance_m: 850
      path_type: "walk"   # 可选，默认 walk
  to_targets:
    - id: "parents_work"
      name: "父母工作地/市中心"
      distance_m: 12000

transport:
  bus: "..."
  drive_notes: "..."

living:
  commerce: "..."
  hospital: "..."
  park: "..."
  school: "..."

property:
  green_rate: 0.35
  landscaping: "较好"
  has_pool: false
  has_kids_playground: true
  has_separation_ped_car: true
  management_fee:
    cny_per_sqm_month_range: "2.8-3.5"
    note: "可选备注"
  parking:
    monthly_rent_cny_range: "300-500"
    spot_price_wan_range: "18-25"
    ratio_note: "可选"
  facilities_note: "..."

housing_stock:
  building_types:
    - type: "洋房"
      total_floors_range: "6-11"
      notes: "电梯洋房"
      layouts:
        - area_sqm_range: "80-90"
          layout_tags: ["2房2厅", "南北"]
          main_supply: true
        - area_sqm_range: "90-100"
          layout_tags: ["3房"]
    - type: "高层"
      total_floors_range: "18-33"
      notes: ""
      layouts:
        - area_sqm_range: "90-100"
          layout_tags: ["2房", "3房"]
          main_supply: true
  my_focus:
    area_sqm_range: "90-100"
    notes: "可选"

pros: ["..."]
cons: ["..."]
risks: ["..."]

images:
  cover: "../assets/communities/binjiang-xx/cover.jpg"
  gallery:
    - "../assets/communities/binjiang-xx/1.jpg"

notes_md: |
  ## 一句话结论
  ...

updated_at: "2026-02-13"
```

### 4.3 面积段规则（强校验）
`housing_stock.building_types[].layouts[].area_sqm_range` 只允许：
- `"80-90"`
- `"90-100"`
- `"100-120"`

---

## 5. 构建期校验（必须）

遍历 `/data/communities/*.yml`：

- 必填字段缺失 → build fail
- `tags` 不是数组 → build fail
- `updated_at` 不符合 YYYY-MM-DD → build fail
- 任意 `area_sqm_range` 不属于三档之一 → build fail

错误输出需包含：文件名 + 字段路径 + 原值。

---

## 6. 距离换算规则（前端展示）

输入：`distance_m`（米），展示时补充估算时间：

- `walk_minutes = round(distance_m / 80)`（≈ 4.8km/h）
- `bike_minutes = round(distance_m / 250)`（≈ 15km/h）

展示格式示例：`850m（步行约11分钟 / 骑行约3分钟）`

---

## 7. 页面设计与交互

### 7.1 列表页 `/communities`

**布局**
- 移动端：单列卡片
- 桌面端：响应式 Grid 多列
- 页面顶部：筛选/排序区域（移动端可折叠）
- 页面底部：固定对比栏（移动端关键）

**卡片内容（有就显示）**
- 封面图（`images.cover`，无则占位）
- `name_zh`
- `district / area`
- `price.ref_wan_per_sqm`、`price.ref_total_wan_range`
- 最近更新 `updated_at`
- tags（Chip，可点击筛选）
- 勾选框：加入对比

**筛选**
- tags 多选（建议 OR 逻辑：任意匹配）
- district、area：若存在则生成下拉（去重）
- 其他字段 Phase 1 不强制

**排序**
- 默认：`updated_at` desc
- 可选：`price.ref_wan_per_sqm`、最近地铁距离（取最小 `distance.metro[].distance_m`）、楼龄（解析 `build.build_year_range` 起始年）

**对比栏**
- 显示已选数量 + 已选小区名（可折叠）
- 按钮：去对比（>=2 才可用）
- 按钮：清空
- 最大 6 个；超过 toast 提示并拒绝继续选择
- 状态持久化：localStorage key `compare_community_ids`

---

### 7.2 详情页 `/communities/<slug-or-id>`

**路由**
- 优先使用 `slug`；无 slug 使用 `id`
- 需能用 slug 查到对象；并提供从 id/slug 互相定位能力（内部映射表）

**模块**
- 标题 + tags
- 基础信息：district/area/build/price
- 距离：地铁列表 + 目标地点列表（距离 + 估算时间）
- 物业与配套：布尔字段以 icon/Chip 展示；费用/范围文本展示
- 房产形态：按 building_types 分组展示；layouts 三档面积段突出 `main_supply`
- links：外链列表
- notes_md：Markdown 渲染

移动端：分组可折叠（Accordion）；对表格与长文本做良好换行/滚动处理。

---

### 7.3 对比页 `/compare`

**来源**
- 默认从 localStorage 读取 ids
- 支持 URL 参数覆盖：`/compare?ids=100001,100002`
  - 若 URL 有 ids，则以 URL 为准并写入 localStorage

**限制**
- 少于 2：提示并提供返回按钮
- 多于 6：截断或提示（建议提示并仅保留前 6 个）

**对比表（行=字段，列=小区）建议包含**
- name、district、area、build_year_range
- ref_wan_per_sqm、ref_total_wan_range
- 最近地铁：站点名 + distance_m + 估算时间
- 物业：has_pool / has_kids_playground / has_separation_ped_car
- 物业费范围、停车费范围、车位价范围
- 房产形态：每种 building_type 的总楼层范围 + 主供面积段（按 80–90/90–100/100–120）

**图表（Phase 1）**
- 条形图：`price.ref_wan_per_sqm`
- 条形图：最近地铁距离（m）
- 可选：`distance.to_targets` 中某个固定 target（如存在）

**交互**
- 每列可移除（从对比中删除）
- 一键清空对比

---

## 8. CI/CD（GitHub Actions）

- on: push (main)
- steps: checkout → setup node → install → build（含 YAML 校验）→ upload artifact → deploy to pages

---

## 9. 验收标准（Phase 1）

- push 新/改 YAML 后，GitHub Pages 自动更新
- 列表页筛选/排序可用，移动端可用
- 勾选 2–6 个可进入对比页，表格+图表正确展示
- 详情页字段分组清晰，notes_md 正常渲染
- YAML 校验生效：非法字段导致构建失败且错误清晰
