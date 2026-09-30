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

## 舒适路线模型（2026-10-01 更新）

- H/N 等 12 条免费校巴全部保留，较慢的可行校巴仍作为备选。起终点与转乘步行分别计算较快 / 舒适路径。候车点屋顶未知，因此候车时间不会当作有盖休息。
- 遮蔽使用 OSM `covered=yes/no`、室内/电梯标记，以及 LandsD `WeatherProof`（1=有盖、2=露天、3=未分类）。未知遮蔽按可能曝晒处理；没有模拟树冠、建筑阴影、云量、湿度、风或空调。
- 三维路网保留 XYZ 高程。OSM 地面步道缺少高程时，用已缓存 Terrarium DEM 做双线性采样（像素中心，约 35 m 地面分辨率）；排除穿楼、桥梁、隧道、楼层和非零层标记。显示高程覆盖及粗估标记，电梯和扶梯升高不计入步行爬升。
- 固定 SunCalc **1.9.0**，返回的太阳高度单位为弧度。自动模式白天日照权重 `max(0.25, sin(altitude))`；烈日模式白天为 1；夜间或关闭模式为 0。这不是实时温度或紫外线预测。
- 偏好成本与通勤分钟分开。成本 = 分钟 + 日晒系数 × 日照权重 × (露天分钟 + 遮蔽未知分钟) + 爬升系数 × 已知步行上升米数 + 楼梯系数 × 楼梯米数 / 75 + 未知坡度系数 × 未知坡度米数 / 75。耗时参数 `(0,0,0,0)`，避晒 `(3,0.12,0.7,0.2)`，少爬坡 `(0.3,0.55,2.5,0.5)`，舒适 `(2,0.35,1.5,0.35)`。它们是工程偏好，不是体感或医学实测标准。
- 对可达电梯另搜索经过该电梯的简单路径，排除重复节点的绕圈，但不因比最快路径慢而删除。候选按完整边序列去重、保留标签。高程更完整后，大学站—新亚的步行耗时增加；较慢校巴回归案例改为大学站—大学体育中心，仍验证慢校巴不会被隐藏。
- 重建 OSM 后执行 `python3 scripts/build-terrain-heights.py`，已纳入 `npm run data:build`。`scripts/verify-comfort.mjs` 验证多个偏好、5 分钟电梯等待、H/N、地图、手机和离线；`SITE_URL` 可指定正式网站。

### 验证范围

- 单元测试额外覆盖周日 H / 平日晚间 N、首末班与条件停站，并确保较慢的可行校巴方案仍会显示。单元测试验证真实数据基本覆盖、简繁搜索、香港时区、公假/周六/教学日、条件停站、特别营业、电梯等待、图方向、跨层分离和无路线行为。
- 浏览器测试验证构建后的 Pages 子路径、实际页面交互、手机无横向溢出、资源加载和断网重载后的路线计算。
- 测试不说明电梯当下可用、门禁开放、入口与高程准确、公交实时到达或路线一定比实地走法最优。
