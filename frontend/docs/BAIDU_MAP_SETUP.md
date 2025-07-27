# 百度地图集成说明

## 概述

本项目已将所有地图功能替换为百度地图，包括：
- 基地位置显示
- 地图选择器
- 坐标转换
- 地理编码和逆地理编码

## 配置步骤

### 1. 获取百度地图API密钥

1. 访问 [百度地图开放平台](https://lbsyun.baidu.com/)
2. 注册并登录账号
3. 创建应用，选择"浏览器端"类型
4. 获取AK（API Key）

### 2. 配置API密钥

在 `frontend/index.html` 中替换API密钥：

```html
<script type="text/javascript" src="https://api.map.baidu.com/api?v=3.0&ak=YOUR_ACTUAL_API_KEY&callback=initBaiduMap"></script>
```

将 `YOUR_ACTUAL_API_KEY` 替换为您的实际API密钥。

### 3. 环境变量配置

在 `frontend/.env` 文件中配置：

```env
# 百度地图API密钥
VITE_BAIDU_MAP_AK=your-actual-api-key
```

## 组件使用

### BaiduMap 基础地图组件

```vue
<template>
  <BaiduMap
    :center="{ lng: 116.404, lat: 39.915 }"
    :zoom="11"
    :markers="markers"
    height="400px"
    @map-ready="handleMapReady"
  />
</template>

<script setup>
import BaiduMap from '@/components/BaiduMap.vue'

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
</script>
```

### MapLocationPicker 位置选择组件

```vue
<template>
  <MapLocationPicker
    v-model="selectedLocation"
    :center="{ lng: 116.404, lat: 39.915 }"
    height="400px"
    @location-change="handleLocationChange"
  />
</template>

<script setup>
import MapLocationPicker from '@/components/MapLocationPicker.vue'

const selectedLocation = ref(null)

const handleLocationChange = (location, address) => {
  console.log('选中位置:', location, '地址:', address)
}
</script>
```

## API 参考

### BaiduMap Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | string | '100%' | 地图宽度 |
| height | string | '400px' | 地图高度 |
| center | object | { lng: 116.404, lat: 39.915 } | 地图中心点 |
| zoom | number | 11 | 缩放级别 |
| enableScrollWheelZoom | boolean | true | 启用滚轮缩放 |
| enableDoubleClickZoom | boolean | true | 启用双击缩放 |
| enableKeyboard | boolean | true | 启用键盘操作 |
| enableDragging | boolean | true | 启用拖拽 |
| enableClick | boolean | false | 启用点击事件 |
| markers | array | [] | 标记点数组 |

### BaiduMap Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| map-click | { lng, lat } | 地图点击事件 |
| map-ready | map | 地图加载完成 |

### MapLocationPicker Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | string | '100%' | 地图宽度 |
| height | string | '400px' | 地图高度 |
| center | object | { lng: 116.404, lat: 39.915 } | 地图中心点 |
| zoom | number | 11 | 缩放级别 |
| modelValue | object | null | 选中的位置 |

### MapLocationPicker Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| update:modelValue | { lng, lat } | 位置更新 |
| location-change | location, address | 位置变化 |

## 工具函数

### 坐标转换

```javascript
import { wgs84ToBd09, bd09ToWgs84 } from '@/utils/baiduMap'

// GPS坐标转百度坐标
const bdCoord = await wgs84ToBd09(116.404, 39.915)

// 百度坐标转GPS坐标
const gpsCoord = await bd09ToWgs84(116.404, 39.915)
```

### 地理编码

```javascript
import { geocodeAddress, reverseGeocode } from '@/utils/baiduMap'

// 地址转坐标
const coord = await geocodeAddress('北京市朝阳区')

// 坐标转地址
const address = await reverseGeocode(116.404, 39.915)
```

### 获取当前位置

```javascript
import { getCurrentPosition } from '@/utils/baiduMap'

try {
  const position = await getCurrentPosition()
  console.log('当前位置:', position)
} catch (error) {
  console.error('定位失败:', error)
}
```

## 注意事项

1. **API密钥安全**: 不要将API密钥提交到公共代码仓库
2. **域名白名单**: 在百度地图控制台配置域名白名单
3. **配额限制**: 注意API调用次数限制
4. **坐标系统**: 百度地图使用BD09坐标系，与GPS的WGS84坐标系不同
5. **网络环境**: 确保能够访问百度地图API服务

## 故障排除

### 地图无法加载

1. 检查API密钥是否正确
2. 检查域名是否在白名单中
3. 检查网络连接
4. 查看浏览器控制台错误信息

### 定位不准确

1. 确保使用正确的坐标系
2. 检查坐标转换是否正确
3. 验证输入的经纬度范围

### 地址解析失败

1. 检查地址格式是否正确
2. 确保地址在百度地图覆盖范围内
3. 检查网络连接状态

## 更新日志

- 2024-01-XX: 完成百度地图集成
- 2024-01-XX: 添加位置选择组件
- 2024-01-XX: 完善工具函数和文档