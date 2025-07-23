// 基础请求配置
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000' 
  : 'https://api.example.com'

// 请求拦截器
function request(options) {
  return new Promise((resolve, reject) => {
    // 设置默认配置
    const config = {
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      timeout: 10000,
      ...options
    }

    // 添加认证token
    const token = uni.getStorageSync('token')
    if (token) {
      config.header.Authorization = `Bearer ${token}`
    }

    // 发起请求
    uni.request({
      ...config,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        reject(new Error('网络请求失败'))
      }
    })
  })
}

export default request