# 高德地图快速开始指南

## 🚀 快速配置

### 1. 获取高德地图API密钥

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并登录
3. 创建应用 → 选择"Web端(JS API)"
4. 获取API Key
5. 配置域名白名单

### 2. 配置API密钥和安全密钥

在 `frontend/index.html` 中配置你的API密钥和安全密钥：

```html
<script>
  // 设置安全密钥（必须在API加载前设置）
  window._AMapSecurityConfig = {
    securityJsCode: 'YOUR_SECURITY_CODE'
  }
</script>
<script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key=YOUR_API_KEY&callback=initAMap"></script>
```

**重要**: 安全密钥是必需的，必须在API脚本加载前设置！

### 3. 基础使用

```vue
<template>
  <!-- 完整功能地图（包含搜索框和卫星地图切换） -->
  <AMapComponent
    :center="{ lng: 116.404, lat: 39.915 }"
    :zoom="11"
    :show-search="true"
    :show-map-type-switch="true"
    height="400px"
  />
</template>

<script setup>
import AMapComponent from '@/components/AMapComponent.vue'
</script>
```

## 🌟 新增功能

### 地点搜索
- **位置**: 地图左上角搜索框
- **功能**: 输入地名、地址或POI名称进行搜索
- **特性**: 实时搜索建议，自动定位到搜索结果

### 卫星地图
- **位置**: 地图右上角切换按钮
- **功能**: 在标准地图和卫星地图之间切换
- **特性**: 高清卫星影像，更直观的地理信息

## 🔧 常见问题

### 问题：地图不显示

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

### 问题：定位失败

**可能原因：**
- 浏览器不支持地理定位
- 用户拒绝了定位权限
- HTTPS环境要求

**解决方法：**
1. 确保在HTTPS环境下使用定位功能
2. 引导用户允许定位权限
3. 提供手动选择位置的备选方案

## 📚 组件说明

### AMapComponent - 基础地图组件
- 支持标记点显示
- 支持地图交互控制
- 支持事件监听

### AMapLocationPicker - 位置选择器
- 点击地图选择位置
- 自动获取地址信息
- 支持双向数据绑定

## 🛠️ 开发调试

### 1. 检查API加载状态

```javascript
console.log('高德地图API状态:', window.AMap ? '已加载' : '未加载')
```

### 2. 监听地图事件

```javascript
map.on('complete', () => {
  console.log('地图加载完成')
})

map.on('click', (e) => {
  console.log('点击位置:', e.lnglat.lng, e.lnglat.lat)
})
```

### 3. 调试工具函数

```javascript
import { getCurrentPosition, geocodeAddress } from '@/utils/amap'

// 测试定位
getCurrentPosition().then(pos => {
  console.log('当前位置:', pos)
}).catch(err => {
  console.error('定位失败:', err)
})

// 测试地理编码
geocodeAddress('北京市').then(result => {
  console.log('地址坐标:', result)
}).catch(err => {
  console.error('地理编码失败:', err)
})
```

## 📖 更多资源

如果遇到问题，可以：
1. 查看浏览器控制台错误信息
2. 检查网络连接和API密钥配置
3. 参考高德地图官方文档：https://lbs.amap.com/api/jsapi-v2/summary

---

**提示**: 本项目已完全从百度地图迁移到高德地图，所有相关功能都已更新。