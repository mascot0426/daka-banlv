<template>
  <view class="page">
    <!-- S2: 打卡主页 -->

    <!-- 统计行 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-num">{{ stats.todo }}</text>
        <text class="stat-label">今日待打</text>
      </view>
      <view class="stat-item">
        <text class="stat-num stat-num--done">{{ stats.done }}</text>
        <text class="stat-label">已完成</text>
      </view>
      <view class="stat-item">
        <text class="stat-num stat-num--overdue">{{ stats.overdue }}</text>
        <text class="stat-label">逾期</text>
      </view>
    </view>

    <!-- 近7日日期横滑条 -->
    <scroll-view class="date-strip" scroll-x="true">
      <view class="date-list">
        <view
          v-for="day in recentDays"
          :key="day.dateStr"
          class="date-cell"
          :class="{
            'date-cell--today': day.isToday,
            'date-cell--done': day.status === 'done',
            'date-cell--partial': day.status === 'partial',
            'date-cell--overdue': day.status === 'overdue'
          }"
          @tap="selectDate(day)"
        >
          <text class="date-week">{{ day.weekLabel }}</text>
          <text class="date-num">{{ day.dayNum }}</text>
          <view class="date-dot" />
        </view>
      </view>
    </scroll-view>

    <!-- 事项列表 -->
    <scroll-view class="item-list" scroll-y="true">
      <view v-if="checkinItems.length === 0" class="dk-empty">
        <text class="dk-empty__icon">📋</text>
        <text class="dk-empty__title">还没有打卡事项</text>
        <text class="dk-empty__sub">点击右上角 + 创建第一个打卡事项</text>
      </view>
      <view
        v-for="item in checkinItems"
        :key="item._id"
        class="item-card"
        :class="{ 'item-card--paused': item.status === 'paused' }"
        @tap="goDetail(item)"
      >
        <view class="item-left">
          <view class="item-icon">
            <text>{{ item.icon || '✅' }}</text>
          </view>
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-repeat dk-text-sub">{{ formatRepeat(item) }}</text>
          </view>
        </view>
        <view class="item-right">
          <view v-if="item.status === 'paused'" class="dk-badge dk-badge--none">
            <text>已暂停</text>
          </view>
          <view v-else-if="item.todayChecked" class="dk-badge dk-badge--done">
            <text>已完成</text>
          </view>
          <view v-else-if="item.isOverdue" class="checkin-btn checkin-btn--overdue" @tap.stop="doCheckin(item, true)">
            <text>补打卡</text>
          </view>
          <view v-else class="checkin-btn" @tap.stop="doCheckin(item, false)">
            <text>打卡</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const stats = ref({ todo: 0, done: 0, overdue: 0 })
const recentDays = ref([])
const checkinItems = ref([])

function buildRecentDays() {
  const days = []
  const today = new Date()
  const weekLabels = ['日', '一', '二', '三', '四', '五', '六']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push({
      dateStr: d.toISOString().slice(0, 10),
      dayNum: d.getDate(),
      weekLabel: weekLabels[d.getDay()],
      isToday: i === 0,
      status: 'empty'
    })
  }
  recentDays.value = days
}

function formatRepeat(item) {
  const map = { daily: '每天', weekly: '每周', monthly: '每月', once: '仅一次' }
  return map[item.repeatType] || item.repeatType
}

function selectDate(day) {
  // TODO: 切换日期查看
}

function doCheckin(item, isSupply) {
  // TODO: 调用云函数完成打卡
  uni.showToast({ title: isSupply ? '补打卡成功' : '打卡成功', icon: 'success' })
}

function goDetail(item) {
  uni.navigateTo({ url: `/pages/checkin/detail?id=${item._id}` })
}

onMounted(() => {
  buildRecentDays()
  // 模拟数据（云函数接入前临时使用）
  stats.value = { todo: 2, done: 1, overdue: 0 }
  checkinItems.value = [
    { _id: '1', name: '每日跑步', repeatType: 'daily', icon: '🏃', status: 'active', todayChecked: false, isOverdue: false },
    { _id: '2', name: '读书30分钟', repeatType: 'daily', icon: '📚', status: 'active', todayChecked: true, isOverdue: false },
    { _id: '3', name: '喝水2000ml', repeatType: 'daily', icon: '💧', status: 'active', todayChecked: false, isOverdue: false }
  ]
})
</script>

<style scoped>
/* S2 打卡主页 — 严格对齐 prototype.html 规范 */
.page {
  min-height: 100vh;
  background: #F8F9FB;
  display: flex;
  flex-direction: column;
}

/* 统计行 */
.stats-row {
  display: flex;
  background: #FFFFFF;
  padding: 24rpx 0 20rpx;
  border-bottom: 2rpx solid #F0F2F7;
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.stat-num {
  font-size: 44rpx;        /* 22px */
  font-weight: 800;
  color: #1A2033;
}
.stat-num--done    { color: #34C759; }
.stat-num--overdue { color: #FF3B30; }
.stat-label {
  font-size: 22rpx;        /* 11px */
  color: #9AA5BE;
}

/* 近7日日期条 */
.date-strip {
  background: #FFFFFF;
  padding: 16rpx 24rpx;
  border-bottom: 2rpx solid #F0F2F7;
  flex-shrink: 0;
}
.date-list {
  display: flex;
  gap: 8rpx;
  white-space: nowrap;
}
.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14rpx 16rpx;
  border-radius: 16rpx;    /* 8px */
  min-width: 72rpx;
  gap: 6rpx;
}
.date-cell--today {
  background: #4F7CFF;
}
.date-cell--today .date-week,
.date-cell--today .date-num { color: #FFFFFF; }
.date-cell--done .date-dot    { background: #34C759; }
.date-cell--partial .date-dot { background: #FF9500; }
.date-cell--overdue .date-dot { background: #FF3B30; }
.date-week {
  font-size: 20rpx;        /* 10px */
  color: #9AA5BE;
}
.date-num {
  font-size: 28rpx;        /* 14px */
  font-weight: 700;
  color: #1A2033;
}
.date-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: transparent;
}

/* 事项列表区 */
.item-list {
  flex: 1;
  padding: 24rpx;
}

/* 事项卡片 — 对齐①卡片规范 */
.item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  border-radius: 32rpx;    /* 16px */
  padding: 24rpx;          /* 12px */
  margin-bottom: 24rpx;    /* 12px */
  border: 2rpx solid #F0F2F7;
  gap: 16rpx;
}
.item-card--paused { opacity: 0.5; }

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  overflow: hidden;
}
.item-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  background: #EEF2FF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}
.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.item-name {
  font-size: 28rpx;        /* 14px */
  font-weight: 700;
  color: #1A2033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-right { flex-shrink: 0; }

/* 打卡按钮 — 对齐②主色按钮规范（小尺寸） */
.checkin-btn {
  background: #4F7CFF;
  color: #FFFFFF;
  padding: 14rpx 28rpx;
  border-radius: 24rpx;    /* 12px */
  font-size: 26rpx;        /* 13px */
  font-weight: 600;
}
.checkin-btn--overdue { background: #FF9500; }
</style>
