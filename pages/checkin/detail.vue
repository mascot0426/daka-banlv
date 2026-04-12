<!--
  code\dakaban\pages\checkin\detail.vue
  S5 · 事项详情页 — 对应原型图 S5 屏幕（浅色风格）

  设计要素:
  - 顶部小标签 "S5 · 事项详情"
  - 自定义导航栏：← 返回 + 标题(动态事项名) + ⋯ 更多
  - Hero 蓝紫渐变卡片：累计完成次数 / 连续天数 / 重复类型 / 完成率
  - 三格数字统计：已完成(绿) / 剩余次数(蓝) / 逾期次数(橙)
  - 本月进度条 + 完成百分比（始终显示，无targetCount也显示）
  - 执行说明文字块（有内容时显示）
  - 操作区：暂停此事项(‖) / 编辑事项(✏️) — 仅2项

  变更历史:
  - v1: 初始版本
  - v2: 重构匹配原型设计
  - v3: 浅色主题修正（深色→浅色）
  - v4: 修复本月进度0% bug + 导航栏S5标签 + 渐变色调整
-->
<template>
  <view class="page">
    <!-- ====== 自定义导航栏（与微信胶囊对齐）====== -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="nav-left" @tap="goBack">
          <text class="nav-back">←</text>
        </view>
        <view class="nav-title">
          <text class="nav-title-text">{{ item.name || '事项详情' }}</text>
        </view>
        <view class="nav-right">
          <text class="nav-more">···</text>
        </view>
      </view>
    </view>

    <scroll-view class="scroll-content" scroll-y :style="{ paddingTop: (statusBarHeight + 44) + 'px' }">
      <view v-if="item._id" class="main-content">

        <!-- ====== Hero 卡片（蓝紫渐变）====== -->
        <view class="hero-card">
          <view class="hero-count-row">
            <text class="hero-count-num">{{ stats.totalDone }}</text>
            <text class="hero-count-unit">次</text>
          </view>
          <text class="hero-subtitle">累计完成打卡</text>
          <view class="hero-chips">
            <view class="hero-chip">
              <text class="chip-icon">🔥</text>
              <text class="chip-text">连续{{ stats.consecutive }}天</text>
            </view>
            <view class="hero-chip">
              <text class="chip-icon">📅</text>
              <text class="chip-text">{{ repeatLabel }}</text>
            </view>
            <view class="hero-chip">
              <text class="chip-icon">✅</text>
              <text class="chip-text">完成率 {{ stats.rate }}%</text>
            </view>
          </view>
        </view>

        <!-- ====== 三格统计 ====== -->
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-num green">{{ stats.totalDone }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <view class="stat-divider-v"></view>
          <view class="stat-item">
            <text class="stat-num blue">{{ stats.remaining }}</text>
            <text class="stat-label">剩余次数</text>
          </view>
          <view class="stat-divider-v"></view>
          <view class="stat-item">
            <text class="stat-num orange">{{ stats.overdue }}</text>
            <text class="stat-label">逾期次数</text>
          </view>
        </view>

        <!-- ====== 本月进度条（始终显示，不再依赖 targetCount）====== -->
        <view class="month-section">
          <text class="section-title">本月进度</text>
          <view class="progress-wrap">
            <view class="progress-header">
              <text class="progress-label">{{ currentMonth }}月完成率</text>
              <text class="progress-value">{{ monthProgress }}%</text>
            </view>
            <view class="progress-track">
              <view class="progress-fill" :style="{ width: monthProgress + '%' }"></view>
            </view>
          </view>
        </view>

        <!-- ====== 分隔线 ====== -->
        <view class="divider-line"></view>

        <!-- ====== 执行说明（有内容时显示）====== -->
        <view class="desc-section" v-if="item.description">
          <text class="section-title">执行说明</text>
          <view class="desc-card">
            <text class="desc-text">{{ item.description }}</text>
          </view>
        </view>

        <!-- ====== 备注信息（如果有）====== -->
        <view class="remark-section" v-if="item.remark">
          <text class="section-title">备注</text>
          <view class="desc-card">
            <text class="desc-text">{{ item.remark }}</text>
          </view>
        </view>

        <!-- ====== 操作区（仅2项：暂停/恢复 + 编辑）====== -->
        <view class="action-section">
          <text class="section-title">操作</text>
          <view class="action-list">
            <!-- 暂停/恢复事项 -->
            <view class="action-row" @tap="togglePause">
              <text class="action-icon action-icon-pause">{{ item.status === 'paused' ? '▶' : '‖' }}</text>
              <view class="action-info">
                <text class="action-name">{{ item.status === 'paused' ? '恢复此事项' : '暂停此事项' }}</text>
                <text class="action-desc">{{ item.status === 'paused' ? '恢复后重新计算剩余次数和提醒' : '暂停期间不计算剩余次数' }}</text>
              </view>
              <text class="action-arrow">›</text>
            </view>

            <!-- 编辑事项 -->
            <view class="action-row" @tap="goEdit">
              <text class="action-icon action-icon-edit">✏️</text>
              <view class="action-info">
                <text class="action-name">编辑事项</text>
                <text class="action-desc">修改名称、说明、重复设置</text>
              </view>
              <text class="action-arrow">›</text>
            </view>
          </view>
        </view>

        <!-- 底部安全距离 -->
        <view style="height: 60rpx;"></view>
      </view>

      <!-- 加载状态 -->
      <view v-else class="loading-wrap">
        <text class="loading-text">加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { formatDate, repeatText, shouldCheckinToday, dateOffset } from '@/utils/checkin-utils.js'

// ---- 数据库引用 ----
const db = wx.cloud.database()
const _ = db.command

// ---- 响应式状态 ----
const item = ref({})
const records = ref([])
const statusBarHeight = ref(0)

// 统计数据
const stats = ref({
  totalDone: 0,     // 累计完成打卡次数
  consecutive: 0,   // 连续天数
  rate: 0,          // 完成率
  remaining: 0,     // 剩余次数
  overdue: 0        // 逾期次数
})

// 计算属性
const repeatLabel = computed(() => {
  return repeatText(item.value) || '自定义'
})

const currentMonth = computed(() => {
  return new Date().getMonth() + 1
})

/**
 * 本月进度计算（v7 修正版 — 考虑重复规则）
 *
 * 算法：本月已打卡天数 / 本月应打卡天数 × 100%
 * - daily 类型: 应打卡天数 = 截至今日日期数
 * - weekly 类型: 应打卡天数 = 本月截止今天符合条件的星期数
 * - monthly/once 类型: 按实际应打天数
 */
const monthProgress = computed(() => {
  if (records.value.length === 0) return 0

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-11
  const todayDate = now.getDate()

  // 构建记录映射
  const recordMap = {}
  records.value.forEach((rec) => {
    if (!rec.date) return
    const d = parseRecordDate(rec.date)
    if (!d) return
    const ds = formatDate(d)
    recordMap[ds] = rec
  })

  // 遍历本月1号到今天，计算应打卡和已打卡
  let dueDays = 0
  let doneDays = 0

  for (let d = 1; d <= todayDate; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const shouldDue = shouldCheckinToday(item.value, dateStr)
    if (shouldDue) {
      dueDays += 1
      if (recordMap[dateStr]) doneDays += 1
    }
  }

  return dueDays > 0 ? Math.round((doneDays / dueDays) * 100) : 0
})

/**
 * 解析记录日期 — 兼容多种格式：
 * - ISO字符串 "2026-04-08"
 * - Date对象
 * - 云开发时间戳 { seconds: xxx }
 */
function parseRecordDate(dateVal) {
  if (!dateVal) return null
  if (dateVal instanceof Date) return dateVal
  if (typeof dateVal === 'string') {
    // 尝试标准日期格式解析
    const parsed = new Date(dateVal.replace(/-/g, '/'))
    return isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof dateVal === 'object' && dateVal.seconds) {
    return new Date(dateVal.seconds * 1000)
  }
  return null
}

// ======================== 数据加载 ========================

async function loadItemDetail(id) {
  try {
    uni.showLoading({ title: '加载中' })

    // ① 加载事项详情
    const itemRes = await db.collection('checkin_items').doc(id).get()
    if (!itemRes.data) {
      uni.showToast({ title: '事项不存在', icon: 'none' })
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) uni.navigateBack()
        else uni.reLaunch({ url: '/pages/checkin/index' })
      }, 1500)
      return
    }
    item.value = itemRes.data

    // ② 获取系统信息（状态栏高度）
    try {
      const sysInfo = wx.getSystemInfoSync()
      statusBarHeight.value = sysInfo.statusBarHeight || 0
    } catch (e) {
      statusBarHeight.value = 20
    }

    // ③ 加载该事项的所有打卡记录（★ 修复：先count再分页获取全部）
    await loadAllRecords(id)

    // ④ 计算统计数据
    calcStats()

    uni.hideLoading()
  } catch (error) {
    console.error('loadItemDetail error', error)
    uni.hideLoading()
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

/**
 * ★ v4 新增：分页加载所有记录，突破20条默认限制
 * 微信云开发 .get() 默认返回20条，超过的事项需要多次拉取
 */
async function loadAllRecords(itemId) {
  const allRecords = []
  let hasMore = true
  let offset = 0
  const LIMIT = 100 // 每次最多取100条

  while (hasMore) {
    try {
      const res = await db.collection('checkin_records')
        .where({ itemId })
        .orderBy('date', 'asc')
        .skip(offset)
        .limit(LIMIT)
        .get()

      const batch = res.data || []
      allRecords.push(...batch)

      if (batch.length < LIMIT) {
        hasMore = false
      } else {
        offset += LIMIT
      }

      // 安全上限：最多拉5000条防止死循环
      if (allRecords.length > 5000) {
        hasMore = false
        console.warn('loadAllRecords: reached safety limit')
      }
    } catch (e) {
      console.error('loadAllRecords page error', e)
      hasMore = false
    }
  }

  records.value = allRecords
}

/** 计算所有统计数据（v7 修正版 — 修复连续天数/完成率/逾期） */
function calcStats() {
  const allRecords = records.value
  const todayStr = formatDate(new Date())
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 构建记录映射 { 'itemId_date': record }
  const recordMap = {}
  allRecords.forEach((rec) => {
    const d = typeof rec.date === 'string' ? rec.date : formatDate(new Date(rec.date))
    if (d) recordMap[`${rec.itemId || item.value._id}_${d}`] = rec
  })

  // ---- ① 累计完成次数 ----
  stats.value.totalDone = allRecords.length

  // ---- ② 连续天数（考虑重复规则）----
  stats.value.consecutive = calcConsecutiveDaysV2(item.value, recordMap, todayStr)

  // ---- ③ 应打卡总次数 / 已完成 / 缺卡 / 逾期 ----
  let dueTotal = 0   // 从创建到今天应该打卡的总天数
  let doneCount = 0   // 应打日中实际完成的天数
  let missedDays = 0  // 应打未打的天数（逾期）
  let makeupCount = 0 // 补打卡记录数

  // 统计补打卡
  allRecords.forEach((rec) => {
    if (rec.isMakeup) makeupCount += 1
  })

  // 遍历从创建日到今天，逐天计算应打/实打/缺卡
  if (item.value.createdAt) {
    const createdDate = parseRecordDate(item.value.createdAt)
    if (createdDate) {
      const iterDate = new Date(createdDate)
      iterDate.setHours(0, 0, 0, 0)
      // 从创建当天开始检查（含创建日）
      while (iterDate <= today) {
        const dayStr = formatDate(iterDate)
        // 判断这天是否应该打卡
        const shouldDue = shouldCheckinToday(item.value, dayStr)
        if (shouldDue) {
          dueTotal += 1
          const hasRecord = recordMap[`${item.value._id}_${dayStr}`]
          if (hasRecord) {
            doneCount += 1
          } else {
            missedDays += 1
          }
        }
        iterDate.setDate(iterDate.getDate() + 1)
      }
    }
  }

  // ---- ④ 逾期次数 = 补打卡数 + 应打未打缺卡数 ----
  stats.value.overdue = makeupCount + missedDays

  // ---- ⑤ 剩余次数 ----
  if (item.value.targetCount && item.value.targetCount > 0) {
    stats.value.remaining = Math.max(0, item.value.targetCount - stats.value.totalDone)
  } else if (dueTotal > 0) {
    // 用应打总数 - 已完成作为参考剩余
    stats.value.remaining = Math.max(0, dueTotal - doneCount)
  } else {
    const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate()
    stats.value.remaining = Math.max(0, daysLeftInMonth)
  }

  // ---- ⑥ 完成率 = 已完成应打天数 / 应打总天数 × 100% ----
  stats.value.rate = dueTotal > 0 ? Math.round((doneCount / dueTotal) * 100) : 100
}

/**
 * v2: 考虑重复规则的连续天数计算
 * 只在"应该打卡"的日期中计算连续性，跳过不需要打卡的日子
 */
function calcConsecutiveDaysV2(targetItem, recordMap, todayStr) {
  let count = 0

  for (let i = 0; i < 365; i++) {
    const d = dateOffset(todayStr, -i)
    // 判断这一天是否应该打卡
    const shouldDue = shouldCheckinToday(targetItem, d)

    if (!shouldDue) {
      // 不需要打卡的日子 → 跳过，不断签
      continue
    }

    // 应该打卡的日期 → 检查有没有实际打卡
    const key = `${targetItem._id}_${d}`
    if (recordMap[key]) {
      count += 1
    } else {
      if (i === 0) continue // 今天还没打不算断
      break // 断了
    }
  }

  return count
}

// ======================== 操作方法 ========================

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/checkin/index' })
  }
}

/** 暂停/恢复切换 */
async function togglePause() {
  const newStatus = item.value.status === 'paused' ? 'active' : 'paused'
  const actionName = newStatus === 'paused' ? '暂停' : '恢复'

  const res = await new Promise((resolve) => {
    uni.showModal({
      title: `${actionName}「${item.value.name}」`,
      content: newStatus === 'paused'
        ? '暂停后该事项不会出现在每日待打卡列表中，可随时恢复。'
        : '恢复后该事项将重新出现在每日待打卡列表中。',
      success: (e) => resolve(e),
      fail: () => resolve({ confirm: false })
    })
  })

  if (!res.confirm) return

  try {
    await db.collection('checkin_items').doc(item.value._id).update({
      data: { status: newStatus }
    })
    item.value.status = newStatus
    uni.showToast({ title: `${actionName}成功`, icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

/** 编辑事项 → 跳转到 create 页面并传入 id 参数 */
function goEdit() {
  uni.navigateTo({ url: `/pages/checkin/create?id=${item.value._id}` })
}

// ======================== 生命周期 ========================

onLoad((options) => {
  if (options && options.id) {
    loadItemDetail(options.id)
  }
})
</script>

<style scoped>
/* ========== 页面容器（浅色背景）========== */
.page {
  min-height: 100vh;
  background-color: #F5F6FA;
}

/* ========== 自定义导航栏（与微信胶囊对齐）========== */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  /* paddingTop 由模板动态设置 statusBarHeight */
  display: flex;
  flex-direction: column;
  background-color: #F5F6FA;
}

.nav-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 24rpx;
}

.nav-left {
  width: 60rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.nav-back {
  font-size: 36rpx;
  color: #1A2033;
  font-weight: 600;
}

.nav-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A2033;
}

.nav-right {
  width: 60rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.nav-more {
  font-size: 36rpx;
  color: #1A2033;
  font-weight: 600;
  letter-spacing: 2rpx;
}

/* ========== 滚动区域 ========== */
.scroll-content {
  height: 100vh;
}

.main-content {
  padding: 0 24rpx;
}

/* ========== Hero 卡片（蓝紫渐变 — 对齐原型版）========== */
.hero-card {
  margin: 20rpx 0 28rpx;
  padding: 36rpx 32rpx 32rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #5B7FF5 0%, #7C3AED 70%, #A855F7 100%);
}

.hero-count-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-bottom: 4rpx;
}

.hero-count-num {
  font-size: 64rpx;
  font-weight: 800;
  color: #FFFFFF;
  line-height: 1.1;
}

.hero-count-unit {
  font-size: 26rpx;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  margin-left: 8rpx;
}

.hero-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 24rpx;
  display: block;
  letter-spacing: 0.5rpx;
}

.hero-chips {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
}

.hero-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 18rpx;
  padding: 10rpx 18rpx;
  gap: 6rpx;
  white-space: nowrap;
  flex: 1;
}

.chip-icon {
  font-size: 18rpx;
  line-height: 1;
}

.chip-text {
  font-size: 20rpx;
  color: #FFFFFF;
  font-weight: 600;
  letter-spacing: 0.3rpx;
}

/* ========== 三格统计 ========== */
.stats-grid {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx 16rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-num {
  font-size: 44rpx;
  font-weight: 800;
}

.stat-num.green { color: #34C759; }
.stat-num.blue { color: #4F7CFF; }
.stat-num.orange { color: #FF9500; }

.stat-label {
  font-size: 22rpx;
  color: #9AA5BE;
  font-weight: 500;
}

.stat-divider-v {
  width: 1rpx;
  height: 56rpx;
  background: #E4E8F0;
}

/* ========== 本月进度 ========== */
.month-section {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1A2033;
  display: block;
  margin-bottom: 16rpx;
}

.progress-wrap {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.progress-label {
  font-size: 26rpx;
  color: #6B7A99;
  font-weight: 500;
}

.progress-value {
  font-size: 26rpx;
  color: #34C759;
  font-weight: 700;
}

.progress-track {
  height: 16rpx;
  background: #E8EAEE;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #34C759, #30D158);
  border-radius: 8rpx;
  transition: width 0.3s ease;
}

/* ========== 分隔线 ========== */
.divider-line {
  height: 1rpx;
  background: rgba(0, 0, 0, 0.06);
  margin: 28rpx 0;
}

/* ========== 说明区域 ========== */
.desc-section,
.remark-section {
  margin-bottom: 24rpx;
}

.desc-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
}

.desc-text {
  font-size: 26rpx;
  color: #4A5568;
  line-height: 1.6;
}

/* ========== 操作区 ========== */
.action-section {
  margin-bottom: 24rpx;
}

.action-list {
  background: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
}

.action-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #F0F2F7;
}

.action-row:last-child {
  border-bottom: none;
}

.action-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 48rpx;
  text-align: center;
}

/* 暂停图标：蓝灰色 */
.action-icon-pause {
  color: #6B7A99;
}

/* 编辑图标：保持原色（铅笔emoji自带颜色）*/
.action-icon-edit {
  /* emoji 自带颜色 */
}

.action-info {
  flex: 1;
}

.action-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A2033;
  display: block;
  line-height: 1.3;
}

.action-desc {
  font-size: 22rpx;
  color: #9AA5BE;
  margin-top: 4rpx;
  display: block;
}

.action-arrow {
  font-size: 32rpx;
  color: #C8CFDE;
  font-weight: 300;
  margin-left: 12rpx;
}

/* ========== 加载状态 ========== */
.loading-wrap {
  display: flex;
  justify-content: center;
  padding-top: 200rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #9AA5BE;
}
</style>
