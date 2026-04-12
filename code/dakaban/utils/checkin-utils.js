/**
 * code\dakaban\utils\checkin-utils.js
 * 打卡伴 - 公共工具函数模块
 *
 * 包含：日期格式化、shouldCheckinToday 判断、连续天数计算、重复规则文本等
 * 被 index.vue（打卡主页）和 calendar.vue（打卡日历页）共同引用
 */

// ======================== 日期工具 ========================

/**
 * 将 Date 对象格式化为 YYYY-MM-DD 字符串
 * @param {Date} date
 * @returns {string} '2026-04-08'
 */
export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 根据基准日期偏移 N 天，返回新的日期字符串
 * @param {string} baseDateStr 基准日期 'YYYY-MM-DD'
 * @param {number} offsetDays 偏移天数（正=未来，负=过去）
 * @returns {string}
 */
export function dateOffset(baseDateStr, offsetDays) {
  const d = new Date(`${baseDateStr}T00:00:00`)
  d.setDate(d.getDate() + offsetDays)
  return formatDate(d)
}

/**
 * 获取日期对应的星期中文简称
 * @param {string|Date} dateStr
 * @returns {string} '日'~'六'
 */
export function weekText(dateStr) {
  const d = typeof dateStr === 'string' ? new Date(`${dateStr}T00:00:00`) : dateStr
  const weekday = d.getDay()
  return ['日', '一', '二', '三', '四', '五', '六'][weekday]
}

/**
 * 获取年月日的组合 key
 * @param {number} year
 * @param {number} month (1-12)
 * @param {number} day
 * @returns {string}
 */
export function getDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * 获取某月的天数
 * @param {number} year
 * @param {number} month (1-12)
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// ======================== 核心判断逻辑 ========================

/**
 * 判断某个事项是否应该在目标日期打卡
 *
 * repeatType: daily(每天) / weekly(每周) / monthly(每月) / once(仅一次)
 * repeatDays: [0,1,2,3,4,5,6] 其中 0=周日，仅 weekly 时使用
 * repeatMonthType: 'date'(按日期) 或 'rule'(按规律)，仅 monthly 时使用
 * repeatMonthValue: '15' 或 'last_day'/'first_day'/'first_monday'/'last_friday'
 * planDate: 仅 once 时使用，格式 YYYY-MM-DD
 *
 * @param {Object} item - checkin_items 记录
 * @param {Date|string} targetDate - 目标日期
 * @returns {boolean}
 */
export function shouldCheckinToday(item, targetDate) {
  if (!item || !targetDate) return false

  const d = typeof targetDate === 'string' ? new Date(`${targetDate}T00:00:00`) : targetDate
  const todayStr = formatDate(d)

  // 检查事项创建时间 — 在创建日期之前不应打卡
  let createdDate = ''
  if (item.createdAt) {
    if (typeof item.createdAt === 'string') {
      createdDate = item.createdAt.slice(0, 10)
    } else if (item.createdAt instanceof Date) {
      createdDate = formatDate(item.createdAt)
    } else if (item.createdAt && typeof item.createdAt === 'object') {
      if (item.createdAt.toDate) {
        createdDate = formatDate(item.createdAt.toDate())
      } else if (item.createdAt.seconds) {
        createdDate = formatDate(new Date(item.createdAt.seconds * 1000))
      }
    } else if (typeof item.createdAt === 'number') {
      // Date.now() 写入的是纯数字时间戳（如 1744089600000）
      createdDate = formatDate(new Date(item.createdAt))
    }
  }
  if (createdDate && todayStr < createdDate) {
    return false
  }

  // 检查计划开始日期 — 在计划开始日期之前不应显示（所有 repeatType 统一生效）
  if (item.planDate && todayStr < item.planDate) {
    return false
  }

  // 暂停状态的事项不参与判断
  if (item.status && item.status !== 'active') {
    return false
  }

  const weekday = d.getDay() // 0=周日

  switch (item.repeatType) {
    case 'daily':
      return true

    case 'weekly': {
      const days = Array.isArray(item.repeatDays)
        ? item.repeatDays.map((x) => Number(x))
        : []
      return days.includes(weekday)
    }

    case 'monthly': {
      const day = d.getDate()
      const daysInMonth = getDaysInMonth(d.getFullYear(), d.getMonth() + 1)

      if (item.repeatMonthType === 'date') {
        return Number(item.repeatMonthValue) === day
      }

      if (item.repeatMonthType === 'rule' || item.repeatMonthType === 'day') {
        const val = item.repeatMonthValue
        if (val === 'last_day') return day === daysInMonth
        if (val === 'first_day') return day === 1
        if (val === 'first_monday') return weekday === 1 && day <= 7
        if (val === 'last_friday') return weekday === 5 && (day + 7 > daysInMonth)
        if (val === 'first_monday') return weekday === 1 && day <= 7
      }
      return false
    }

    case 'once': {
      const planDate = item.planDate || createdDate
      return !!planDate && planDate === todayStr
    }

    default:
      return false
  }
}

// ======================== 文本与展示 ========================

/**
 * 返回事项的重复规则中文描述
 * @param {Object} item
 * @returns {string}
 */
export function repeatText(item) {
  if (!item) return ''
  switch (item.repeatType) {
    case 'daily': return '每日'
    case 'weekly': {
      if (Array.isArray(item.repeatDays) && item.repeatDays.length > 0) {
        const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        const selected = item.repeatDays.map((d) => names[d]).join('、')
        return `每周${selected}`
      }
      return '每周'
    }
    case 'monthly':
      if (item.repeatMonthType === 'date') return `每月${item.repeatMonthValue}号`
      return '每月'
    case 'once': return '仅一次'
    default: return '自定义'
  }
}

/**
 * 构建事项卡片的副标题描述
 * 统一格式：频率·连续X天（与 index.vue 保持一致）
 * @param {Object} item
 * @param {Object} extraInfo - 额外信息 { consecutiveDays? }
 * @returns {string}
 */
export function buildItemSubtitle(item, extraInfo = {}) {
  const freq = repeatText(item)
  const cons = extraInfo.consecutiveDays != null ? extraInfo.consecutiveDays : 0

  if (cons > 0) {
    return `${freq}·连续${cons}天`
  }
  return freq
}

// ======================== 状态计算 ========================

/**
 * 计算某一天的打卡状态汇总
 * @param {Array} items - 所有 active 的 checkin_items
 * @param {Object} recordMap - 打卡记录映射 { 'itemId_date': true }
 * @param {Date|string} date - 目标日期
 * @param {string} todayStr - 今天日期字符串
 * @returns {{ status: string, dueCount: number, doneCount: number }}
 *   status: 'today'|'done'|'overdue'|'partial'|'none'
 */
export function calcDayStatus(items, recordMap, date, todayStr) {
  let dueCount = 0
  let doneCount = 0

  const dateStr = typeof date === 'string' ? date : formatDate(date)

  ;(items || []).forEach((item) => {
    if (shouldCheckinToday(item, date)) {
      dueCount += 1
      if (recordMap && recordMap[`${item._id}_${dateStr}`]) {
        doneCount += 1
      }
    }
  })

  let status = 'none'

  if (dueCount === 0) {
    status = 'none'
  } else if (doneCount === dueCount) {
    status = 'done'
  } else if (dateStr < todayStr) {
    status = 'overdue'
  } else if (doneCount > 0) {
    status = 'partial'
  } else {
    status = 'partial' // 当天有应打卡项但未完成 → partial（待打卡）
  }

  return { status, dueCount, doneCount }
}

/**
 * 计算某个事项的连续打卡天数（从今天往前逐日查找）
 * @param {string} itemId
 * @param {Object} recordMap - 打卡记录映射
 * @param {Array} items - 用于获取 repeatType
 * @param {string} todayStr
 * @returns {number}
 */
export function calcConsecutiveDays(itemId, recordMap, items, todayStr) {
  let count = 0

  for (let i = 0; i < 365; i++) {
    const d = dateOffset(todayStr, -i)
    const key = `${itemId}_${d}`

    if (recordMap[key]) {
      count += 1
    } else {
      // 如果今天还没打，不算断签；从昨天开始断了才算
      if (i === 0) continue
      break
    }
  }

  return count
}

/**
 * 判断逾期项是否可以补打卡（近7天内）
 * @param {string} dateStr 逾期日期
 * @param {string} todayStr
 * @returns {boolean}
 */
export function canMakeup(dateStr, todayStr) {
  if (!dateStr || !todayStr) return false
  const diffMs = new Date(`${todayStr}T00:00:00`).getTime() - new Date(`${dateStr}T00:00:00`).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays >= 1 && diffDays <= 7
}

// ======================== 日历构建辅助 ========================

/**
 * 构建月历网格数据（包含上月填充和下月填充）
 * @param {number} year
 * @param {number} month (1-12)
 * @param {Object} dailyStatsMap - 每日统计 { 'YYYY-MM-DD': { dueCount, doneCount, rate } }
 * @param {number} todayYear
 * @param {number} todayMonth
 * @param {number} todayDate
 * @returns {Array<Object>} 日期格数组
 */
export function buildCalendarCells(year, month, dailyStatsMap, todayYear, todayMonth, todayDate) {
  const cells = []
  const firstWeekDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = getDaysInMonth(year, month)

  // 上月填充日期
  for (let i = 0; i < firstWeekDay; i++) {
    cells.push({ isEmpty: true })
  }

  // 当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = getDateKey(year, month, day)
    const isFuture =
      year > todayYear ||
      (year === todayYear && month > todayMonth) ||
      (year === todayYear && month === todayMonth && day > todayDate)
    const isToday = year === todayYear && month === todayMonth && day === todayDate
    const stats = (dailyStatsMap && dailyStatsMap[dateKey]) || {
      dueCount: 0,
      doneCount: 0,
      rate: 0
    }

    let type = 'plain'
    let rateText = ''

    if (isFuture) {
      type = 'future'
    } else if (isToday) {
      type = 'today'
    } else if (stats.dueCount === 0) {
      type = 'plain'
    } else if (stats.doneCount === stats.dueCount) {
      type = 'done'
    } else if (dateKey < getDateKey(todayYear, todayMonth, todayDate)) {
      type = 'overdue'
    } else if (stats.doneCount > 0) {
      type = 'partial'
      rateText = `${stats.rate}%`
    } else {
      type = 'plain'
    }

    cells.push({
      isEmpty: false,
      day,
      type,
      rateText,
      isFuture,
      isToday,
      dateKey,
      dueCount: stats.dueCount,
      doneCount: stats.doneCount
    })
  }

  return cells
}

/**
 * 构建月度摘要统计数据
 * @param {Object} dailyStatsMap
 * @param {string} todayKey
 * @returns {{ activeDays: number, rateText: string, overdueDays: number }}
 */
export function buildMonthSummary(dailyStatsMap, todayKey) {
  let activeDays = 0
  let overdueDays = 0
  let totalDue = 0
  let totalDone = 0

  Object.keys(dailyStatsMap || {}).forEach((dateKey) => {
    const item = dailyStatsMap[dateKey]
    if (!item) return

    if (item.dueCount > 0) {
      activeDays += 1
    }

    if (dateKey < todayKey && item.dueCount > item.doneCount) {
      overdueDays += 1
    }

    totalDue += item.dueCount
    totalDone += item.doneCount
  })

  const rate = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0

  return {
    activeDays,
    overdueDays,
    rateText: `${rate}%`
  }
}
