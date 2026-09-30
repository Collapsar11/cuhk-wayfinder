# 数据、证据和更新

所有静态记录为 2026-10-01 香港时间收集的快照；`retrievedAt` 采用源脚本 UTC 或标明的日期。不是实时地图，也未做实地踏勘。运行所需的处理后数据已提交 Git，无须重新下载便可构建。

## 来源

| 内容 | 公开来源 | 处理方法 |
|---|---|---|
| 校园地点 / 站点 | [官方校园地图](https://www.cuhk.edu.hk/chinese/campus/cuhk-campus-map.html)、[地点数据库](https://www.cuhk.edu.hk/english/js/campus/cuhk_location_db.js) | 仅解析已知数组的 JSON 记录，不执行下载的 JS。去除 inactive 记录，保留坐标、双语名称、类别、来源和时间。 |
| 步道 / 建筑 | [OSM API 区域导出](https://api.openstreetmap.org/api/0.6/map?bbox=114.197,22.408,114.222,22.432) | XML 转 GeoJSON 和邻接图。保留步行方向与楼层标签，排除显式 private/no access 及无可核实连接的室内线段。 |
| 官方近路 | [CUHK OAL Essential Shortcuts](https://www.oalglobal.cuhk.edu.hk/campus-tour-essential-shortcut/) | 路线 2、4、6、8 交叉核对 YIA—WMY、MMW、LSK、WMW。三个 OSM 电梯节点按官方楼层拆开；不能把同一经纬度当作同一楼层。 |
| 三维行人路网 | [地政总署 CSDI ArcGIS 图层](https://portal.csdi.gov.hk/server/rest/services/common/landsd_rcd_1637222018065_52265/MapServer/0)、[API 文档](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-pedestrian-route-search) | 查询 bbox `114.198,22.412,114.214,22.429`、4326、returnZ；按 OBJECTID 排序分页 3,000+1,469 条，直到 exceededTransferLimit 消失。完整快照共有 4,469 条。 |
| 3D 图内高程 | 同上 | 构造 10,137 个 XYZ 节点、10,635 条分段边；约 6,191 节点属最大连通分量。带 AccessTimeID 的 18 条路段排除，包括下载范围内两个电梯，避免忽略限制。原始数据中只记录少量电梯，不能取代官方近路指南。 |
| 地形 | [Mapzen/AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/{x}/{y}.png`，x=3346..3348、y=1785..1787。原始地形分辨率不足以代表楼层或局部台阶；仅供地形展示。 |
| 校巴 | [CUHK Transport](https://transport.cuhk.edu.hk/)、[日间 PDF](https://transport.cuhk.edu.hk/wp-content/uploads/documents/Shuttle.pdf)、[夜间/假日 PDF](https://transport.cuhk.edu.hk/wp-content/uploads/documents/NH.pdf)、[转堂 PDF](https://transport.cuhk.edu.hk/wp-content/uploads/documents/Meet-Class.pdf) | 视觉核对 2026-09-01 生效时刻表，手动编码站序、分钟规则、条件停站和周六末班。不是把图上左右位置当作行驶序列。 |
| 校历 / 公假 | [中大校历文件](https://rgsntl.rgs.cuhk.edu.hk/aqs_prd_applx/public/handbook/view_document.aspx?id=1510&lang=zh&seq=1)、[政府公假页](https://www.gov.hk/en/about/abouthk/holiday/index.htm) | 保存 2026 年公假和 2026–27 学期范围。2027 公假尚未核实，已禁止 2027 的校巴推算。 |
| 餐厅 / 开放时段 | [ueatwhat](https://ueatwhat.com/)、[restaurants](https://api.ueatwhat.com/api/restaurants)、[holidays](https://api.ueatwhat.com/api/holidays)、[overrides](https://api.ueatwhat.com/api/overrides) | 36 家餐厅，按名称合并部分官方地点。特别安排优先于公假和每周时刻表。营业截止时间不包含在“营业中”区间。 |
| CU BUS | [iOS](https://apps.apple.com/app/id1434225006)、[Android](https://play.google.com/store/apps/details?id=com.carsonwah.cubus) | 提供官方商店入口。没有接入可依赖的公开实时接口。 |

搜索 GitHub 发现的[历史校园地点 gist](https://gist.github.com/seventhmoon/8234c5bbde540c2c33da)仅用于交叉核对；发布的数据以本次官方数据为准。检索了小红书，但没有把未经独立核实的帖子当作可通行边。Google Maps 只作为独立外部导航入口，没有抓取其受限制的地图或图片。

## 原始档案与复现

本次大型原始资料依用户要求保存于：

- `/Volumes/H/cuhk-wayfinder/sources-2026-10-01/`：学校地图数据库、OSM XML、校巴 PDF、餐厅 JSON、文档和检查用图片，约 40 MB。
- `/Volumes/H/cuhk-wayfinder/raw/lands-campus-network.json`：完整的 4,469 条三维路段，约 4.5 MB。
- 本项目 `data/raw` 是指向第一个目录的本地符号链接，不提交 Git。第一个目录中早期 `lands-campus-network.json` 只有 3,000 条，不作为最终构建输入。
- [来源清单](source-manifest.json)保留下载链接、时间、原始文件 SHA-256 和处理后文件 SHA-256。原始 HTML/第三方应用 JS 不随网站发布。

原始资料齐备后：

```sh
npm run data:build
python3 scripts/build-lands.py /Volumes/H/cuhk-wayfinder/raw/lands-campus-network.json
npm test
```

`data:build` 按顺序运行地点、OSM 图、跨层近路、校巴编译。重复执行前会重新从 OSM 源构造图，不会叠加电梯。脚本仅重建既有人工审核过的规则，不会自动确认新校巴表、施工公告或近路状态。

更新时先建立新的原始资料快照目录，把 `data/raw` 指向它。`npm run data:fetch` 下载官方网页与 JSON 等公开源，另用 `scripts/fetch-lands.py` 完整分页下载三维路网；不要把新增数据未经核对就覆盖已确认的时刻表规则。地形缓存是小范围固定快照，无须每次重复下载。

## 验证能说明什么

- 单元测试验证真实数据基本覆盖、简繁搜索、香港时区、公假/周六/教学日、条件停站、特别营业、电梯等待、图方向、跨层分离和无路线行为。
- 浏览器测试验证构建后的 Pages 子路径、实际页面交互、手机无横向溢出、资源加载和断网重载后的路线计算。
- 测试不说明电梯当下可用、门禁开放、入口与高程准确、公交实时到达或路线一定比实地走法最优。
