import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// Configure dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * Format time to readable string
 */
export const formatTime = (date: string | Date, format = 'HH:mm:ss'): string => {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).fromNow()
}

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  if (!date) return false
  return dayjs(date).isSame(dayjs(), 'day')
}

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: string | Date): boolean => {
  if (!date) return false
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')
}

/**
 * Format date for display (smart format)
 */
export const formatDateSmart = (date: string | Date): string => {
  if (!date) return ''
  
  const target = dayjs(date)
  const now = dayjs()
  
  if (target.isSame(now, 'day')) {
    return target.format('HH:mm')
  } else if (target.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天 ' + target.format('HH:mm')
  } else if (target.isSame(now, 'year')) {
    return target.format('MM-DD HH:mm')
  } else {
    return target.format('YYYY-MM-DD HH:mm')
  }
}

/**
 * Get date range for common periods
 */
export const getDateRange = (period: 'today' | 'yesterday' | 'week' | 'month' | 'year'): [string, string] => {
  const now = dayjs()
  
  switch (period) {
    case 'today':
      return [
        now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        now.endOf('day').format('YYYY-MM-DD HH:mm:ss')
      ]
    case 'yesterday':
      const yesterday = now.subtract(1, 'day')
      return [
        yesterday.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        yesterday.endOf('day').format('YYYY-MM-DD HH:mm:ss')
      ]
    case 'week':
      return [
        now.startOf('week').format('YYYY-MM-DD HH:mm:ss'),
        now.endOf('week').format('YYYY-MM-DD HH:mm:ss')
      ]
    case 'month':
      return [
        now.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
        now.endOf('month').format('YYYY-MM-DD HH:mm:ss')
      ]
    case 'year':
      return [
        now.startOf('year').format('YYYY-MM-DD HH:mm:ss'),
        now.endOf('year').format('YYYY-MM-DD HH:mm:ss')
      ]
    default:
      return [
        now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        now.endOf('day').format('YYYY-MM-DD HH:mm:ss')
      ]
  }
}

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: string | Date): number => {
  if (!birthDate) return 0
  return dayjs().diff(dayjs(birthDate), 'year')
}

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  if (!date1 || !date2) return 0
  return Math.abs(dayjs(date1).diff(dayjs(date2), 'day'))
}

/**
 * Check if date is in the future
 */
export const isFuture = (date: string | Date): boolean => {
  if (!date) return false
  return dayjs(date).isAfter(dayjs())
}

/**
 * Check if date is in the past
 */
export const isPast = (date: string | Date): boolean => {
  if (!date) return false
  return dayjs(date).isBefore(dayjs())
}

/**
 * Format duration in minutes to readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}小时`
    } else {
      return `${hours}小时${remainingMinutes}分钟`
    }
  }
}