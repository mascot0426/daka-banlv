<template>
  <view class="page">
    <!-- S3: 打卡日历（完整版） -->

    <!-- 月份切换栏 -->
    <view class="month-nav">
      <view class="nav-btn" @tap="prevMonth"><text>‹</text></view>
      <text class="month-label">{{ currentYear }}年{{ currentMonth }}月</text>
      <view class="nav-btn" @tap="nextMonth"><text>›</text></view>
    </view>

    <!-- 星期标题行 -->
    <view class="week-header">
      <text v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="week-label">{{ w }}</text>
    </view>

    <!-- 日历格子 -->
    <view class="calendar-grid">
      <view
        v-for="(cell, idx) in calendarCells"
        :key="idx"
        class="calendar-cell"
        :class="getCellClass(cell)"
        @tap="cell.date ? selectDay(cell) : null"
      >
        <text class="cell-num">{{ cell.day }}</text>
        <view v-if="cell.date && cell.status" class="cell-dot" :class="getDotClass(cell.status)" />
        <text v-if="cell.status === 'partial'" class="cell-rate">{{ cell.rate }}</text>
      </view>
    </view>

    <!-- 图例说明 -->
    <view class="legend">
      <view class="legend-item">
        <view class="legend-dot" style="background:#34C759" />
        <text>全部完成</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot" style="background:#FF9500" />
        <text>部分完成</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot" style="background:#FF3B30" />
        <text>逾期</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot" style="background:#C8CFDE" />
        <text>未完成</text>
      </view>
    </view>

    <!-- 月度摘要入口 -->
    <view class="summary-btn" @tap="genSummary">
      <text>📊 生成月度摘要</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)
const calendarData = ref({})

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: '', date: null, status: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const info = calendarData.value[dateStr] || {}
    cells.push({
      day: d,
      date: dateStr,
      status: info.status || null,
      rate: info.rate || ''
    })
  }
  return cells
})

function getCellClass(cell) {
  const todayStr = today.toISOString().slice(0, 10)
  if (!cell.date) return 'cell--empty'
  if (cell.date === todayStr) return 'cell--today'
  return ''
}

function getDotClass(status) {
  const map = { done: 'dot--green', partial: 'dot--orange', overdue: 'dot--red', pending: 'dot--gray' }
  return map[status] || ''
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadCalendarData()
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadCalendarData()
}

function selectDay(cell) {
  // 点击某天跳转打卡主页并定位到该日期
  uni.navigateBack()
}

function genSummary() {
  uni.showToast({ title: '月度摘要功能开发中', icon: 'none' })
}

function loadCalendarData() {
  // TODO: 从云数据库加载当月打卡记录，计算每日状态
  // status: 'done' | 'partial' | 'overdue' | 'pending'
}

onMounted(() => {
  loadCalendarData()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F6FA;
  padding: 0 0 40rpx;
}
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 40rpx;
  background: #fff;
  border-bottom: 1rpx solid #F0F2F7;
}
.nav-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #F0F2F7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #4A5568;
}
.month-label {
  font-size: 32rpx;
  font-weight: 800;
  color: #2D3748;
}
.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #fff;
  padding: 16rpx 0 8rpx;
}
.week-label {
  text-align: center;
  font-size: 24rpx;
  color: #9AA5BE;
  font-weight: 600;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #fff;
  padding: 8rpx 16rpx 24rpx;
  gap: 8rpx 0;
  margin-bottom: 24rpx;
}
.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 0;
  border-radius: 12rpx;
  min-height: 80rpx;
  gap: 4rpx;
}
.cell--today {
  background: #EEF2FF;
}
.cell--today .cell-num {
  color: #4F7CFF;
  font-weight: 800;
}
.cell--empty { opacity: 0; }
.cell-num {
  font-size: 28rpx;
  font-weight: 600;
  color: #2D3748;
}
.cell-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
}
.dot--green { background: #34C759; }
.dot--orange { background: #FF9500; }
.dot--red { background: #FF3B30; }
.dot--gray { background: #C8CFDE; }
.cell-rate {
  font-size: 18rpx;
  color: #FF9500;
  font-weight: 600;
}
.legend {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  margin: 0 24rpx 24rpx;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}
.legend-item text {
  font-size: 22rpx;
  color: #9AA5BE;
}
.summary-btn {
  margin: 0 24rpx;
  background: #4F7CFF;
  color: #fff;
  text-align: center;
  padding: 28rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 700;
}
</style>
