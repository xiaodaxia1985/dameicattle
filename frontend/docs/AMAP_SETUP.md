# 高德地图集成说明

## 概述

本项目已将所有地图功能替换为高德地图，包括：
- 基地位置显示
- 地图选择器
- 位置标记和信息窗口
- 地理编码和逆地理编码

## 配置步骤

### 1. 获取高德地图API密钥

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并登录账号
3. 创建应用，选择"Web端(JS API)"类型
4. 获取API Key

### 2. 配置API密钥和安全密钥

在 `frontend/index.html` 文件中配置API密钥和安全密钥：

```html
<script>
  // 设置安全密钥（必须在API加载前设置）
  window._AMapSecurityConfig = {
    securityJsCode: 'YOUR_SECURITY_CODE'
  }
</script>
<script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key=YOUR_API_KEY&callback=initAMap"></script>
```

### 3. 环境变量配置

在 `.env` 文件中添加：

```env
# 高德地图API密钥
VITE_AMAP_KEY=your-actual-api-key

# 高德地图安全密钥
VITE_AMAP_SECURITY_CODE=your-security-code
```

**重要提示**: 
- API密钥和安全密钥都是必需的
- 安全密钥必须在API脚本加载前设置
- 请确保在高德地图控制台正确配置域名白名单

## 组件使用

### AMapComponent 基础地图组件

```vue
<template>
  <AMapComponent
    :center="{ lng: 116.404, lat: 39.915 }"
    :zoom="11"
    :markers="markers"
    :show-search="true"
    :show-map-type-switch="true"
    height="400px"
    @map-ready="handleMapReady"
    @map-click="handleMapClick"
  />
</template>

<script setup>
import AMapComponent from '@/components/AMapComponent.vue'

const markers = [
  {
    lng: 116.404,
    lat: 39.915,
    title: '北京',
    content: '中国首都'
  }
]

const handleMapReady = (map) => {
  console.log('地图加载完成', map)
}

const handleMapClick = (event) => {
  console.log('地图点击', event.lng, event.lat)
}
</script>
```

### AMapLocationPicker 位置选择组件

```vue
<template>
  <AMapLocationPicker
    v-model="selectedLocation"
    :center="{ lng: 116.404, lat: 39.915 }"
    :zoom="11"
    height="400px"
    @location-change="handleLocationChange"
  />
</template>

<script setup>
import AMapLocationPicker from '@/components/AMapLocationPicker.vue'
import { ref } from 'vue'

const selectedLocation = ref(null)

const handleLocationChange = (location, address) => {
  console.log('位置变化', location, address)
}
</script>
```

## API 参考

### AMapComponent Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | string | '100%' | 地图宽度 |
| height | string | '400px' | 地图高度 |
| center | object | { lng: 116.404, lat: 39.915 } | 地图中心点 |
| zoom | number | 11 | 缩放级别 |
| enableScrollWheelZoom | boolean | true | 是否启用滚轮缩放 |
| enableDoubleClickZoom | boolean | true | 是否启用双击缩放 |
| enableKeyboard | boolean | true | 是否启用键盘操作 |
| enableDragging | boolean | true | 是否启用拖拽 |
| enableClick | boolean | false | 是否启用点击事件 |
| showSearch | boolean | true | 是否显示搜索框 |
| showMapTypeSwitch | boolean | true | 是否显示地图类型切换按钮 |
| markers | array | [] | 标记点数组 |

### AMapComponent Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| map-ready | map | 地图加载完成 |
| map-click | { lng, lat } | 地图点击事件 |

### AMapLocationPicker Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | string | '100%' | 地图宽度 |
| height | string | '400px' | 地图高度 |
| center | object | { lng: 116.404, lat: 39.915 } | 地图中心点 |
| zoom | number | 11 | 缩放级别 |
| modelValue | object | null | 选中的位置 |
| showLocationInfo | boolean | true | 是否显示位置信息 |

## 工具函数

### 坐标转换

```javascript
import { wgs84ToGcj02, gcj02ToWgs84 } from '@/utils/amap'

// GPS坐标转高德坐标
const gcjCoord = await wgs84ToGcj02(116.404, 39.915)

// 高德坐标转GPS坐标
const gpsCoord = await gcj02ToWgs84(116.404, 39.915)
```

### 地理编码

```javascript
import { geocodeAddress, reverseGeocode } from '@/utils/amap'

// 地址转坐标
const location = await geocodeAddress('北京市朝阳区')

// 坐标转地址
const address = await reverseGeocode(116.404, 39.915)
```

### 定位服务

```javascript
import { getCurrentPosition } from '@/utils/amap'

try {
  const position = await getCurrentPosition()
  console.log('当前位置:', position.lng, position.lat)
} catch (error) {
  console.error('定位失败:', error)
}
```

### 搜索功能

```javascript
import { searchPOI, getSearchSuggestions } from '@/utils/amap'

// POI搜索
const searchResults = await searchPOI('北京大学', '北京')

// 获取搜索建议
const suggestions = await getSearchSuggestions('北京', '北京')
```

## 新增功能

### 1. 地点搜索
- **位置**: 地图左上角搜索框
- **功能**: 支持输入地名、地址、POI名称进行搜索
- **特性**: 
  - 实时搜索建议（输入时自动显示相关地点）
  - 搜索结果自动定位并添加标记
  - 支持全国范围搜索
  - 智能地址匹配

### 2. 卫星地图
- **位置**: 地图右上角切换按钮
- **功能**: 在标准地图和卫星地图之间切换
- **特性**: 
  - 高清卫星影像
  - 更直观的地理信息展示
  - 一键切换，无需刷新页面

### 3. 可拖拽标记功能
- 搜索后的标记支持拖拽调整位置
- 拖拽后自动更新坐标和地址信息
- 实时反馈位置变化

### 4. 使用示例

```vue
<template>
  <!-- 带搜索和卫星地图的完整地图 -->
  <AMapComponent
    :center="{ lng: 116.404, lat: 39.915 }"
    :zoom="11"
    :show-search="true"
    :show-map-type-switch="true"
    height="500px"
  />
  
  <!-- 位置选择器（支持搜索、拖拽、地址解析） -->
  <AMapLocationPicker
    v-model="selectedLocation"
    :show-search="true"
    :show-map-type-switch="true"
    height="400px"
    @location-change="handleLocationChange"
  />
  
  <!-- 仅显示基础地图（无搜索和切换功能） -->
  <AMapComponent
    :center="{ lng: 116.404, lat: 39.915 }"
    :zoom="11"
    :show-search="false"
    :show-map-type-switch="false"
    height="400px"
  />
</template>

<script setup>
const selectedLocation = ref(null)

const handleLocationChange = (location, address) => {
  console.log('位置:', location)
  console.log('地址:', address)
}
</script>
```

## 注意事项

1. **API密钥安全**: 不要将API密钥提交到公共代码仓库
2. **域名白名单**: 在高德地图控制台配置域名白名单
3. **配额限制**: 注意API调用次数限制
4. **坐标系统**: 高德地图使用GCJ02坐标系，与GPS的WGS84坐标系不同
5. **网络环境**: 确保能够访问高德地图API服务

## 故障排除

### 问题：地图无法显示

**可能原因：**
- API密钥错误或未配置
- 域名未在高德地图控制台配置白名单
- 网络连接问题

**解决方法：**
1. 检查浏览器控制台是否有错误信息
2. 确认API密钥正确
3. 在高德地图控制台添加当前域名到白名单

### 问题：TypeError: AMap.Map is not a constructor

**解决方法：**
1. 检查网络连接，确保能访问高德地图API
2. 清除浏览器缓存并刷新页面
3. 检查API密钥是否有效

### 问题：地理编码失败

**可能原因：**
- 地址格式不正确
- 地址不在高德地图覆盖范围内
- API调用频率过高

**解决方法：**
1. 检查地址格式是否正确
2. 确保地址在高德地图覆盖范围内
3. 检查网络连接状态

## 更新日志

- 2024-01-XX: 完成高德地图集成
- 2024-01-XX: 添加位置选择组件
- 2024-01-XX: 完善工具函数和文档

## 参考资料

- [高德地图JS API文档](https://lbs.amap.com/api/jsapi-v2/summary)
- [高德地图开发指南](https://lbs.amap.com/api/jsapi-v2/guide/abc/prepare)
- [坐标系说明](https://lbs.amap.com/api/jsapi-v2/guide/transform/convertcoordinate)