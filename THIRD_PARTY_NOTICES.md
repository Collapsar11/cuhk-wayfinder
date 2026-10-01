# Third-party data and assets

The application's MIT license does **not** relicense the following data, assets, names, logos, or third-party packages. Snapshot date: 2026-10-01 (Hong Kong).

| Material | Files / use | Attribution and terms |
|---|---|---|
| OpenStreetMap | `public/data/basemap.json`, OSM-derived `graph.json`, supplemental stop coordinates | © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Database made available under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The OSM-derived databases and modifications are offered under ODbL; application source is separate. |
| Hong Kong Lands Department / CSDI | `public/data/lands-graph.json`, `public/landsd-logo.png` | Map from Lands Department. © The Government of the Hong Kong Special Administrative Region. Source: [CSDI Portal](https://portal.csdi.gov.hk/). Data remain subject to [CSDI Terms of Use](https://portal.csdi.gov.hk/csdi-webpage/doc/TNC); no accuracy/completeness warranty. Logo included solely for attribution, not endorsement. |
| CUHK | Location facts, bilingual names, bus route/time facts and four shortcut descriptions (paraphrased) | Sources linked in [DATA.md](docs/DATA.md) and the app. Copyright and associated rights remain with The Chinese University of Hong Kong. This is an independent tool, not an official CUHK product. No campus photography or full university pages are republished. |
| ueatwhat / 中大今天吃什么 | 36 restaurant records, hours and public holiday/special-hour facts | [ueatwhat.com](https://ueatwhat.com/), public JSON endpoints. No blanket reuse license is asserted by this project. Credit and timestamps retained; app code, menus, reviews, and photographs are not copied into the published site. Prices/hours may be stale. |
| Mapzen Terrain Tiles | Nine local Terrarium PNG tiles at zoom 12 | [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), [source-specific attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). Derived from open elevation sources, including SRTM for this region. Please retain upstream attribution. |
| MapLibre GL JS | Map rendering | BSD-3-Clause. [Project](https://github.com/maplibre/maplibre-gl-js). |
| OpenCC-JS | Traditional/simplified Chinese search | MIT application/library portions; upstream conversion data have their own notices, including Apache-2.0. See `node_modules/opencc-js/THIRD_PARTY_LICENSES.md`. [Project](https://github.com/nk2028/opencc-js). |
| Lucide | Interface icons | ISC. [License](https://lucide.dev/license). |
| AndroidX WebKit and AndroidX dependencies | APK local HTTPS asset loading | Apache-2.0. Copyright The Android Open Source Project. [AndroidX](https://developer.android.com/jetpack/androidx), [license](https://www.apache.org/licenses/LICENSE-2.0). |

Google Maps and CU BUS are linked external services; the app does not redistribute their tiles, photos, 3D models, or real-time bus data. Brand names are used to identify services.

## SunCalc 1.9.0

Used for departure-time solar altitude, not weather.

Copyright (c) 2014, Vladimir Agafonkin
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
