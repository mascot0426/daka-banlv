<!--
  code\dakaban\pages\checkin\calendar.vue
  打卡日历页 — 提示词 07 重构版（图四S3模板）

  变更概要：
  - 导航栏改为：‹返回 + 标题「打卡日历」+ 右侧＋号按钮
  - 月历卡片更紧凑（gap 6rpx，日期格圆角16rpx）
  - 新增「当日详情展开区」替代原底部抽屉
  - 月度摘要卡片使用渐变底 + 「↗ 分享摘要卡片」链接
  - 支持从主页传参自动定位日期
  - 引用公共模块 checkin-utils.js
-->
<template>
  <view class="cal-page">
    <!-- ====== ① 导航栏 ====== -->
    <scroll-view scroll-y class="cal-scroll">
      <!-- ====== ② 紧凑月历卡片 ====== -->
      <view class="month-card">
        <!-- 月份切换行 -->
        <view class="month-bar">
          <view class="arrow-btn" @tap="prevMonth">
            <text class="arrow-text">‹</text>
          </view>
          <text class="month-label">{{ currentYear }}年{{ currentMonth }}月</text>
          <view
            class="arrow-btn"
            :class="{ 'arrow-disabled': isCurrentMonth }"
            @tap="nextMonth"
          >
            <text class="arrow-text">›</text>
          </view>
        </view>

        <!-- 星期表头 -->
        <view class="week-row">
          <text v-for="w in weekList" :key="w" class="week-cell">{{ w }}</text>
        </view>

        <!-- 日期网格 -->
        <view class="date-grid">
          <view
            v-for="(cell, idx) in calendarCells"
            :key="idx"
            class="date-cell"
            :class="getCellClass(cell)"
            @tap="handleSelectDate(cell)"
          >
            <template v-if="!cell.isEmpty">
              <text class="date-num">{{ cell.day }}</text>
              <text v-if="cell.rateText" class="date-rate">{{ cell.rateText }}</text>
            </template>
          </view>
        </view>

        <!-- 图例行 -->
        <view class="legend-row">
          <view class="legend-item">
            <view class="legend-dot legend-done"></view>
            <text class="legend-txt">全部完成</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot legend-partial"></view>
            <text class="legend-txt">部分完成</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot legend-overdue"></view>
            <text class="legend-txt">有逾期</text>
          </view>
        </view>
      </view>

      <!-- ====== ③ 当日详情展开区（★ 替代原抽屉）====== -->
      <view class="detail-section" v-if="selectedCell && !selectedCell.isEmpty">
        <text class="detail-title">{{ selectedDetailTitle }}</text>

        <!-- 详情项列表 -->
        <template v-if="detailItems.length > 0">
          <view
            v-for="di in detailItems"
            :key="di.itemId"
            class="detail-row"
          >
            <!-- 左侧勾选框 -->
            <view class="check-box" :class="{ 'checked': di.checked }">
              <text v-if="di.checked" class="check-icon">✓</text>
            </view>
            <!-- 中间信息 -->
            <view class="detail-info">
              <text class="detail-name">{{ di.name }}</text>
              <text class="detail-sub">{{ di.subText }}</text>
            </view>
            <!-- 右侧标签 -->
            <text class="detail-badge" :class="`badge-${di.badgeType}`">{{ di.badgeLabel }}</text>
          </view>
        </template>

        <!-- 无事项提示 -->
        <view v-else class="detail-empty">
          <text class="detail-empty-text">当天无应打卡事项</text>
        </view>
      </view>

      <!-- ====== ④ 月度摘要卡片（★ 渐变底 + 分享链接）====== -->
      <view class="summary-card">
        <text class="summary-title">{{ currentMonth }}月数据摘要</text>

        <view class="summary-grid">
          <view class="summary-item">
            <text class="s-val s-green">{{ monthSummary.activeDays }}</text>
            <text class="s-lbl">打卡天数</text>
          </view>
          <view class="summary-item">
            <text class="s-val s-blue">{{ monthSummary.rateText }}</text>
            <text class="s-lbl">完成率</text>
          </view>
          <view class="summary-item">
            <text class="s-val s-orange">{{ monthSummary.overdueDays }}</text>
            <text class="s-lbl">逾期次数</text>
          </view>
        </view>

        <view class="share-link-wrap" @tap="shareSummary">
          <text class="share-link">↗ 分享摘要卡片</text>
        </view>
      </view>

      <!-- ====== ⑤ 底部固定按钮 ====== -->
      <view class="bottom-action">
        <view class="gen-btn" @tap="openSummaryDialog">
          <text class="gen-btn-text">生成本月摘要</text>
        </view>
      </view>

      <view style="height: 40rpx;" />
    </scroll-view>

    <!-- 摘要弹窗 -->
    <view v-if="showSummaryDlg" class="dlg-mask" @tap="closeSummaryDialog"></view>
    <view class="dlg-panel" :class="{ 'dlg-show': showSummaryDlg }">
      <view class="dlg-head">
        <text class="dlg-head-title">{{ currentYear }}年{{ currentMonth }}月摘要</text>
        <view class="dlg-close" @tap="closeSummaryDialog">
          <text class="dlg-close-x">×</text>
        </view>
      </view>

      <view class="dlg-body">
        <view class="dlg-banner">
          <text class="dlg-banner-tit">本月坚持概览</text>
          <text class="dlg-banner-sub">以下数据基于当前月份月历统计结果生成</text>
        </view>

        <view class="dlg-grid">
          <view class="dlg-gi">
            <text class="dlg-gv s-green">{{ monthSummary.activeDays }}</text>
            <text class="dlg-gl">打卡天数</text>
          </view>
          <view class="dlg-gi">
            <text class="dlg-gv s-blue">{{ monthSummary.rateText }}</text>
            <text class="dlg-gl">整体完成率</text>
          </view>
          <view class="dlg-gi">
            <text class="dlg-gv s-orange">{{ monthSummary.overdueDays }}</text>
            <text class="dlg-gl">逾期次数</text>
          </view>
        </view>
      </view>

      <view class="dlg-foot">
        <view class="dlg-btn dlg-btn-ghost" @tap="closeSummaryDialog">
          <text class="dlg-btn-ghost-txt">关闭</text>
        </view>
        <view class="dlg-btn dlg-btn-primary" @tap="shareSummary">
          <text class="dlg-btn-pri-txt">分享</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  formatDate,
  getDateKey,
  getDaysInMonth,
  shouldCheckinToday,
  buildCalendarCells,
  buildMonthSummary,
  calcConsecutiveDays,
  repeatText
} from '@/utils/checkin-utils.js'

// ---- 常量 ----
const weekList = ['日', '一', '二', '三', '四', '五', '六']
const now = new Date()
const todayYear = now.getFullYear()
const todayMonth = now.getMonth() + 1
const todayDate = now.getDate()
const todayKey = getDateKey(todayYear, todayMonth, todayDate)

// ---- 状态 ----
const currentYear = ref(todayYear)
const currentMonth = ref(todayMonth)
const selectedDateKey = ref(todayKey)
const urlDateParam = ref('') // 从主页传来的日期参数

const itemList = ref([])
const recordMap = ref({})
const dailyStatsMap = ref({})
const monthSummary = ref({ activeDays: 0, rateText: '0%', overdueDays: 0 })

const showSummaryDlg = ref(false)

// ======================== 计算属性 ========================

/** 是否为当前月份 */
const isCurrentMonth = computed(() => {
  return currentYear.value === todayYear && currentMonth.value === todayMonth
})

/** 日历网格数据 */
const calendarCells = computed(() => {
  return buildCalendarCells(
    currentYear.value,
    currentMonth.value,
    dailyStatsMap.value,
    todayYear,
    todayMonth,
    todayDate
  )
})

/** 当前选中的单元格 */
const selectedCell = computed(() => {
  const found = calendarCells.value.find((c) => c.dateKey === selectedDateKey.value)
  return found || null
})

/** 详情区标题 */
const selectedDetailTitle = computed(() => {
  if (!selectedCell.value) return `${currentMonth.value}月1日 详情`
  const d = selectedCell.value
  // 解析 dateKey 获取月和日
  const parts = (d.dateKey || '').split('-')
  if (parts.length === 3) {
    return `${Number(parts[1])}月${Number(parts[2])}日 详情`
  }
  return `${currentMonth.value}月${d.day}日 详情`
})

/** 详情项列表 — 根据选中日期计算每个事项的状态 */
const detailItems = computed(() => {
  if (!selectedCell.value || selectedCell.value.isEmpty) return []
  const dateKey = selectedCell.value.dateKey
  const list = []

  itemList.value.forEach((item) => {
    const dateObj = new Date(`${dateKey}T00:00:00`)
    const should = shouldCheckinToday(item, dateObj)
    if (!should) return

    const checked = !!recordMap.value[`${item._id}_${dateKey}`]
    let badgeType = 'pending'
    let badgeLabel = '待打'
    let subText = '待执行'

    if (checked) {
      badgeType = 'done'
      badgeLabel = '已打'
      // 尝试获取打卡时间和累计次数
      const record = recordMap.value[`${item._id}_${dateKey}`]
      if (record && record.checkedAt) {
        let timeStr = ''
        if (typeof record.checkedAt === 'string') {
          timeStr = record.checkedAt.slice(11, 5)
        } else if (record.checkedAt instanceof Date) {
          timeStr = `${String(record.checkedAt.getHours()).padStart(2,'0')}:${String(record.checkedAt.getMinutes()).padStart(2,'0')}`
        }
        subText = timeStr ? `${timeStr} 完成·第?次` : `已完成`
      } else {
        subText = '已完成'
      }
    } else if (dateKey < todayKey) {
      badgeType = 'overdue'
      badgeLabel = '待打' // 逾期未打也显示待打（红色）
      subText = '待执行（已逾期）'
    }

    list.push({
      itemId: item._id,
      name: item.name,
      subText,
      checked,
      badgeType,
      badgeLabel
    })
  })

  return list
})

// ======================== 数据加载 ========================

async function loadMonthData() {
  if (typeof wx === 'undefined' || !wx.cloud || !wx.cloud.database) {
    uni.showToast({ title: '当前环境未启用云开发', icon: 'none' })
    return
  }

  uni.showLoading({ title: '加载中' })

  const db = wx.cloud.database()
  const _ = db.command

  // 计算月份范围
  const start = getDateKey(currentYear.value, currentMonth.value, 1)
  const endDay = getDaysInMonth(currentYear.value, currentMonth.value)
  const end = getDateKey(currentYear.value, currentMonth.value, endDay)

  try {
    // ★ 小程序端 limit 上限为 20，必须分页循环取全部数据
    const PAGE_SIZE = 20
    async function fetchAll(collection, query, orderByField) {
      let allData = []
      let skip = 0
      let hasMore = true
      while (hasMore) {
        let q = collection.where(query).skip(skip).limit(PAGE_SIZE)
        if (orderByField) q = q.orderBy(orderByField, 'desc')
        const res = await q.get()
        const data = res.data || []
        allData = allData.concat(data)
        if (data.length < PAGE_SIZE) {
          hasMore = false
        } else {
          skip += PAGE_SIZE
        }
      }
      return allData
    }

    const itemsCondition = { status: 'active' }
    const recordsCondition = { date: _.gte(start).and(_.lte(end)) }

    const [allItemData, allRecordData] = await Promise.all([
      fetchAll(db.collection('checkin_items'), itemsCondition),
      fetchAll(db.collection('checkin_records'), recordsCondition)
    ])

    itemList.value = allItemData

    // 构建记录映射
    const map = {}
    allRecordData.forEach((rec) => {
      if (!rec.itemId || !rec.date) return
      map[`${rec.itemId}_${rec.date}`] = rec
    })
    recordMap.value = map

    // 构建每日统计
    buildDailyStats()
    // 构建月度摘要
    monthSummary.value = buildMonthSummary(dailyStatsMap.value, todayKey)

    // 重置选中日期
    resetSelectedDate()
  } catch (error) {
    console.error('loadMonthData error', error)
    uni.showToast({ title: '月历数据加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function buildDailyStats() {
  const endDay = getDaysInMonth(currentYear.value, currentMonth.value)
  const stats = {}

  for (let day = 1; day <= endDay; day++) {
    const dateKey = getDateKey(currentYear.value, currentMonth.value, day)
    const dateObj = new Date(currentYear.value, currentMonth.value - 1, day)

    let dueCount = 0
    let doneCount = 0

    itemList.value.forEach((item) => {
      if (!shouldCheckinToday(item, dateObj)) return
      dueCount += 1
      if (recordMap.value[`${item._id}_${dateKey}`]) doneCount += 1
    })

    stats[dateKey] = { dueCount, doneCount, rate: dueCount > 0 ? Math.round((doneCount / dueCount) * 100) : 0 }
  }

  dailyStatsMap.value = stats
}

function resetSelectedDate() {
  // 优先使用 URL 参数定位
  if (urlDateParam.value) {
    const parts = urlDateParam.value.split('-')
    if (parts.length === 3) {
      const y = Number(parts[0])
      const m = Number(parts[1])
      if (y === currentYear.value && m === currentMonth.value) {
        selectedDateKey.value = urlDateParam.value
        return
      }
    }
  }

  // 默认选今天
  const todayCell = calendarCells.value.find((c) => !c.isEmpty && c.isToday)
  if (todayCell) {
    selectedDateKey.value = todayCell.dateKey
    return
  }

  // 选最后一个可用日期
  const lastAvailable = [...calendarCells.value].reverse().find((c) => !c.isEmpty && !c.isFuture)
  if (lastAvailable) {
    selectedDateKey.value = lastAvailable.dateKey
  }
}

// ======================== 交互操作 ========================

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value -= 1
  } else {
    currentMonth.value -= 1
  }
  loadMonthData()
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value += 1
  } else {
    currentMonth.value += 1
  }
  loadMonthData()
}

function handleSelectDate(cell) {
  if (!cell || cell.isEmpty || cell.isFuture) return
  selectedDateKey.value = cell.dateKey
}

function getCellClass(cell) {
  if (!cell || cell.isEmpty) return 'cell-empty'

  const cls = [`cell-${cell.type}`]

  // 非今天且非未来的选中态：蓝色边框
  if (cell.dateKey === selectedDateKey.value && !cell.isToday && !cell.isFuture) {
    cls.push('cell-selected')
  }

  return cls.join(' ')
}

function shareSummary() {
  const title = `${currentYear.value}年${currentMonth.value}月打卡摘要`
  const path = `/pages/checkin/calendar?year=${currentYear.value}&month=${currentMonth.value}`

  if (typeof wx !== 'undefined') {
    // 触发分享面板（通过 onShareAppMessage 配合）
    uni.showToast({ title: '请使用右上角菜单分享', icon: 'none' })
  } else {
    uni.showToast({ title: '当前环境不支持分享', icon: 'none' })
  }
}

function openSummaryDialog() {
  showSummaryDlg.value = true
}

function closeSummaryDialog() {
  showSummaryDlg.value = false
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/checkin/index' })
  }
}

function goCreate() {
  uni.navigateTo({ url: '/pages/checkin/create' })
}

// ======================== 分享配置 ========================
onShareAppMessage(() => ({
  title: `${currentYear.value}年${currentMonth.value}月打卡摘要`,
  path: `/pages/checkin/calendar?year=${currentYear.value}&month=${currentMonth.value}`
}))

// ======================== 生命周期 ========================

onLoad((options) => {
  // 接收主页传来的日期参数
  if (options && options.date) {
    urlDateParam.value = options.date
    // 尝试解析年月并切换到对应月份
    const parts = options.date.split('-')
    if (parts.length >= 3) {
      const y = Number(parts[0])
      const m = Number(parts[1])
      if (y && m && (y !== currentYear.value || m !== currentMonth.value)) {
        currentYear.value = y
        currentMonth.value = m
      }
    }
  }
})

onShow(() => {
  loadMonthData()
})
</script>

<style scoped lang="scss">
/* ========== 页面容器 ========== */
.cal-page {
  min-height: 100vh;
  background: #F8F9FB;
}

/* ========== ① 导航栏 ========== */
.cal-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1px solid #F0F2F7;
}

.nav-back {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back-icon {
  font-size: 36rpx;
  color: #1A2033;
  font-weight: 700;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A2033;
}

.nav-plus-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #4F7CFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-plus-icon {
  font-size: 28rpx;
  color: #fff;
  font-weight: 700;
}

/* ========== 滚动区域 ========== */
.cal-scroll {
  height: calc(100vh - 96rpx);
  padding: 24rpx;
  box-sizing: border-box;
}

/* ========== ② 月历卡片 ========== */
.month-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx 24rpx 24rpx;
  margin-bottom: 24rpx;
  border: 1.5px solid #F0F2F7;
}

.month-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.arrow-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #F0F2F7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-disabled {
  opacity: 0.4;
}

.arrow-text {
  font-size: 30rpx;
  color: #6B7A99;
  font-weight: 700;
}

.month-label {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A2033;
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 12rpx;
}

.week-cell {
  text-align: center;
  font-size: 22rpx;
  font-weight: 600;
  color: #9AA5BE;
  padding: 8rpx 0;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6rpx;
}

.date-cell {
  aspect-ratio: 1;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cell-empty {
  opacity: 0;
}

.date-num {
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.1;
}

.date-rate {
  font-size: 16rpx;
  font-weight: 600;
  margin-top: 4rpx;
}

/* 日期格颜色状态 */
.cell-plain { color: #9AA5BE; }
.cell-future { background: #F4F6FA; color: #C0C7D8; border-radius: 16rpx; }
.cell-done { background: #EDFAF2; color: #34C759; border-radius: 16rpx; }
.cell-partial { background: #FFF5E6; color: #FF9500; border-radius: 16rpx; }
.cell-overdue { background: #FFF0EF; color: #FF3B30; border-radius: 16rpx; }
.cell-today { background: #4F7CFF; color: #FFFFFF; border-radius: 16rpx; box-shadow: 0 6rpx 16rpx rgba(79,124,255,0.25); }
.cell-selected { outline: 3px solid #4F7CFF; outline-offset: -2px; }

/* 图例行 */
.legend-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 0rpx;
  margin-top: 24rpx;
  padding-top: 16rpx;
  border-top: 1px solid #F0F2F7;
}

.legend-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
}

.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 6rpx;
}

.legend-done { background: #EDFAF2; }
.legend-partial { background: #FFF5E6; }
.legend-overdue { background: #FFF0EF; }

.legend-txt {
  font-size: 22rpx;
  color: #6B7A99;
}

/* ========== ③ 当日详情展开区 ========== */
.detail-section {
  margin-bottom: 24rpx;
}

.detail-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1A2033;
  margin-bottom: 16rpx;
}

.detail-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 12rpx;
  border: 1.5px solid #F0F2F7;
}

.check-box {
  width: 40rpx;
  height: 40rpx;
  border-radius: 12rpx;
  border: 3px solid #C8CFDE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.check-box.checked {
  background: #4F7CFF;
  border-color: #4F7CFF;
}

.check-icon {
  font-size: 22rpx;
  color: #fff;
}

.detail-info {
  flex: 1;
  min-width: 0;
}

.detail-name {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #1A2033;
}

.detail-sub {
  display: block;
  font-size: 22rpx;
  color: #9AA5BE;
  margin-top: 4rpx;
}

.detail-badge {
  font-size: 22rpx;
  font-weight: 600;
  border-radius: 40rpx;
  padding: 6rpx 18rpx;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-done { color: #34C759; background: #EDFAF2; }
.badge-pending { color: #4F7CFF; background: #EEF2FF; }
.badge-overdue { color: #FF3B30; background: #FFF0EF; }

.detail-empty {
  text-align: center;
  padding: 32rpx;
  background: #F8F9FB;
  border-radius: 24rpx;
}

.detail-empty-text {
  font-size: 26rpx;
  color: #9AA5BE;
}

/* ========== ④ 月度摘要卡片 ========== */
.summary-card {
  background: linear-gradient(135deg, #EEF2FF, #F5EEFF);
  border-radius: 32rpx;
  padding: 32rpx 24rpx 24rpx;
  margin-bottom: 24rpx;
}

.summary-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1A2033;
  margin-bottom: 20rpx;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.summary-item {
  background: rgba(248, 249, 251, 0.85);
  border-radius: 20rpx;
  padding: 20rpx 10rpx 16rpx;
  text-align: center;
}

.s-val {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1;
}
.s-green { color: #34C759; }
.s-blue { color: #4F7CFF; }
.s-orange { color: #FF9500; }

.s-lbl {
  display: block;
  font-size: 20rpx;
  color: #9AA5BE;
  margin-top: 8rpx;
}

.share-link-wrap {
  text-align: center;
  padding-top: 8rpx;
}

.share-link {
  font-size: 24rpx;
  color: #4F7CFF;
  font-weight: 600;
}

/* ========== ⑤ 底部按钮 ========== */
.bottom-action {
  padding: 8rpx 0 16rpx;
}

.gen-btn {
  background: #4F7CFF;
  border-radius: 24rpx;
  padding: 28rpx;
  text-align: center;
}

.gen-btn-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #FFFFFF;
}

/* ========== 弹窗 ========== */
.dlg-mask {
  position: fixed;
  inset: 0;
  background: rgba(26, 32, 51, 0.24);
  z-index: 100;
}

.dlg-panel {
  position: fixed;
  left: 48rpx;
  right: 48rpx;
  top: 50%;
  transform: translateY(-50%) scale(0.92);
  opacity: 0;
  pointer-events: none;
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 32rpx 24rpx 24rpx;
  z-index: 101;
  box-shadow: 0 18rpx 60rpx rgba(24, 32, 54, 0.18);
  transition: all 0.24s ease;
}

.dlg-show {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) scale(1);
}

.dlg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.dlg-head-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A2033;
}

.dlg-close {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #F2F4F8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dlg-close-x {
  font-size: 30rpx;
  color: #7D89A6;
}

.dlg-body { margin-bottom: 24rpx; }

.dlg-banner {
  background: linear-gradient(135deg, #EEF2FF, #F5EEFF);
  border-radius: 22rpx;
  padding: 22rpx 20rpx;
  margin-bottom: 18rpx;
}

.dlg-banner-tit {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1A2033;
}

.dlg-banner-sub {
  display: block;
  font-size: 20rpx;
  color: #6B7A99;
  margin-top: 6rpx;
}

.dlg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.dlg-gi {
  background: #F8F9FB;
  border-radius: 20rpx;
  padding: 20rpx 8rpx 16rpx;
  text-align: center;
}

.dlg-gv {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1;
}

.dgl {
  display: block;
  font-size: 18rpx;
  color: #9AA5BE;
  margin-top: 8rpx;
}

.dlg-foot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.dlg-btn {
  height: 76rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dlg-btn-ghost { background: #F2F4F8; }
.dlg-btn-ghost-txt { font-size: 26rpx; font-weight: 700; color: #6B7A99; }
.dlg-btn-primary { background: linear-gradient(135deg, #4F7CFF, #7093FF); }
.dlg-btn-pri-txt { font-size: 26rpx; font-weight: 700; color: #FFFFFF; }
</style>