import * as echarts from 'echarts'

// 自定义图表主题
export const customTheme = {
  color: [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
    '#909399', '#C45656', '#73767A', '#626AEF',
    '#FF9F7F', '#FFDB5C', '#37A2FF', '#32C5E9'
  ],
  backgroundColor: 'transparent',
  textStyle: {},
  title: {
    textStyle: {
      color: '#303133'
    },
    subtextStyle: {
      color: '#909399'
    }
  },
  line: {
    itemStyle: {
      borderWidth: 1
    },
    lineStyle: {
      width: 2
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false
  },
  radar: {
    itemStyle: {
      borderWidth: 1
    },
    lineStyle: {
      width: 2
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false
  },
  bar: {
    itemStyle: {
      barBorderWidth: 0,
      barBorderColor: '#ccc'
    }
  },
  pie: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  scatter: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  boxplot: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  parallel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  sankey: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  funnel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  gauge: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  candlestick: {
    itemStyle: {
      color: '#67C23A',
      color0: '#F56C6C',
      borderColor: '#67C23A',
      borderColor0: '#F56C6C',
      borderWidth: 1
    }
  },
  graph: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    },
    lineStyle: {
      width: 1,
      color: '#aaa'
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false,
    color: [
      '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
      '#909399', '#C45656', '#73767A', '#626AEF'
    ],
    label: {
      color: '#303133'
    }
  },
  map: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5
    },
    label: {
      color: '#000'
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1
      },
      label: {
        color: 'rgb(100,0,0)'
      }
    }
  },
  geo: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5
    },
    label: {
      color: '#000'
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1
      },
      label: {
        color: 'rgb(100,0,0)'
      }
    }
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#DCDFE6'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#DCDFE6'
      }
    },
    axisLabel: {
      show: true,
      color: '#606266'
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E4E7ED']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)']
      }
    }
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#DCDFE6'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#DCDFE6'
      }
    },
    axisLabel: {
      show: true,
      color: '#606266'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#E4E7ED']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)']
      }
    }
  },
  logAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#DCDFE6'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#DCDFE6'
      }
    },
    axisLabel: {
      show: true,
      color: '#606266'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#E4E7ED']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)']
      }
    }
  },
  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#DCDFE6'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#DCDFE6'
      }
    },
    axisLabel: {
      show: true,
      color: '#606266'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#E4E7ED']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)']
      }
    }
  },
  toolbox: {
    iconStyle: {
      borderColor: '#999'
    },
    emphasis: {
      iconStyle: {
        borderColor: '#666'
      }
    }
  },
  legend: {
    textStyle: {
      color: '#303133'
    }
  },
  tooltip: {
    axisPointer: {
      lineStyle: {
        color: '#DCDFE6',
        width: 1
      },
      crossStyle: {
        color: '#DCDFE6',
        width: 1
      }
    }
  },
  timeline: {
    lineStyle: {
      color: '#DCDFE6',
      width: 1
    },
    itemStyle: {
      color: '#A4A4A4',
      borderWidth: 1
    },
    controlStyle: {
      color: '#A4A4A4',
      borderColor: '#A4A4A4',
      borderWidth: 0.5
    },
    checkpointStyle: {
      color: '#409EFF',
      borderColor: '#409EFF'
    },
    label: {
      color: '#A4A4A4'
    },
    emphasis: {
      itemStyle: {
        color: '#FFF'
      },
      controlStyle: {
        color: '#A4A4A4',
        borderColor: '#A4A4A4',
        borderWidth: 0.5
      },
      label: {
        color: '#A4A4A4'
      }
    }
  },
  visualMap: {
    color: ['#409EFF', '#67C23A', '#E6A23C']
  },
  dataZoom: {
    backgroundColor: 'rgba(47,69,84,0)',
    dataBackgroundColor: 'rgba(255,255,255,0.3)',
    fillerColor: 'rgba(167,183,204,0.4)',
    handleColor: '#a7b7cc',
    handleSize: '100%',
    textStyle: {
      color: '#333'
    }
  },
  markPoint: {
    label: {
      color: '#303133'
    },
    emphasis: {
      label: {
        color: '#303133'
      }
    }
  }
}

// 注册主题
export const registerCustomTheme = () => {
  echarts.registerTheme('custom', customTheme)
}

// 格式化数值
export const formatNumber = (value: number, precision = 0): string => {
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + '万'
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k'
  }
  return value.toFixed(precision)
}

// 格式化百分比
export const formatPercentage = (value: number, precision = 1): string => {
  return value.toFixed(precision) + '%'
}

// 格式化货币
export const formatCurrency = (value: number): string => {
  return '¥' + value.toLocaleString()
}

// 获取颜色
export const getColor = (index: number): string => {
  return customTheme.color[index % customTheme.color.length]
}