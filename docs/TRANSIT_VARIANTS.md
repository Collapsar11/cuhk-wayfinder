# 特殊班次与环回东临时站（2026-10-01 核对）

以前时刻表计算包含条件规则，但页面只显示主线路，周六卡片还沿用了平日时段。现在将六种特殊服务作为独立班次类型，在校巴页、实际班次和路线结果中保持同一标识；不是新增六个官方线路编号。

| 班次 | 时间及站点差异 | 来源 |
| --- | --- | --- |
| 2（停邵逸夫堂） | 07:45–18:45，每小时 :45；:15 不停邵逸夫堂。官网原条件为每小时 31 至 00 分始发的班次 | https://transport.cuhk.edu.hk/route/2/ |
| 5（星期六） | 仅教学周六，09:18–13:26，:18 / :22 / :26 | https://transport.cuhk.edu.hk/route/5/ |
| 6A（星期六） | 仅教学周六，09:10–13:10，:10 | https://transport.cuhk.edu.hk/route/6a/ |
| 7（星期六） | 仅教学周六，08:18–13:18，:00 / :18，限时段内 | https://transport.cuhk.edu.hk/route/7/ |
| 8（非教学日） | 周一至六、公假除外，07:35–18:35，:15 / :35 / :55；末段改停大学站广场及崇基教学楼，不停大学站 | https://transport.cuhk.edu.hk/route/8/ |
| H（停39区） | 周日及公假整点始发，实际首末班 09:00–23:00；停研宿一座及 39 区上行；:20 / :40 班不走这两个站 | https://transport.cuhk.edu.hk/route/h/ |

`src/transit-variants.js` 按互斥条件生成 18 种服务模式。每天每个线路编号、始发分钟只有一个实例。N 线仍按具体班次控制研宿停站。`createTrips`、校巴卡片和规划结果共用这些记录，没有给静态页面单独伪造班次。

## 环回东站不是停用

- [上行公告](https://transport.cuhk.edu.hk/newsdetails/bus-stop-temporary-relocation-campus-circuit-east-upward/)：2026-09-28 起至工程完结，4 / 8 迁到夏鼎基运动场东南侧、网球场南端弯道附近。
- [下行公告](https://transport.cuhk.edu.hk/newsdetails/bus-stop-temporary-relocation-campus-circuit-east-downwards/)：2026-09-19 08:35 起至工程完结，8 下行迁到物业管理处大楼外侧。
- 图片下载并人工查看，原件保存于 `/Volumes/H/cuhk-wayfinder/raw/circuit-east-up-relocation.jpg` 与 `circuit-east-down-relocation.jpg`。它们是无经纬度、非测量的示意图；上行 `[22.41830,114.21270]`、下行 `[22.41928,114.21297]` 为参照 OSM 运动场、网球场及物业管理处位置推定的近似坐标，不能当作精确站牌坐标。
- `resolveStops` 仅在生效时间之后替换坐标，保留原站 ID 62 / 63、原坐标与公告；`suspension` 才表示停用。旧实现把所有公告站一律屏蔽，已移除。
- PGH1 → 敬文餐厅回归案例要求实际搭乘 8（教学日或非教学日），站序 `62 → 64`；上车前步行与下车后步行都来自现有路网。每种可行直达班次独立保留；同一到达时间选择步行更少的上车点，防止错误建议先走远路去康本上同一班车。
- 29 个运营线路途经的站点加入地点搜索与地图。57 条原始坐标记录仍保留作数据来源，并不宣称这些记录全部仍有班次。餐厅搜索补充“敬文can”等别名。

## 验证范围

`tests/transit-variants.test.js` 检查六个显示名称、首末班、周六停驶、非教学日站序、H 整点条件、无重复班次、迁站生效时间、PGH1 经环回东 8 号线至敬文餐厅以及搜索。浏览器脚本 `scripts/verify-transit-variants.mjs` 检查手机实际卡片、地图临时站、搜索、路线提示和离线查询。既有 H/N、SHB 连廊和舒适规划测试继续运行。以上均非实地走路、GPS 到站或精确临时站坐标验证。
