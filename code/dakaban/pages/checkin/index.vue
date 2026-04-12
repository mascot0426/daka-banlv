<!--
  code\dakaban\pages\checkin\index.vue
  打卡主页 — 提示词 07 重构版（图三模板）

  变更概要：
  - 标题从「打卡伴」→「今日打卡」
  - 移除「日历」标签按钮，日期条整体区域可点击跳转日历
  - 统计行改为紧凑形式：左侧「累 X/Y 次」+ 右侧「HH:mm 打卡」
  - 事项卡片支持5种状态：待打卡/已完成/已逾期(含补打卡)/已暂停/未来
  - 新增补打卡功能（近7天内可补打，标记 isMakeup=true）
  - 新增长按暂停功能
  - 空状态引导
  - 引用公共模块 checkin-utils.js
-->
<template>
  <view class="page dk-page">
    <!-- ====== ① 顶部导航栏（自定义，适配状态栏）====== -->
    <view class="top-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <!-- 第一行：居中导航标题（与微信胶囊同行高度） -->
      <view class="nav-row-top">
        <text class="nav-center-title">打卡</text>
      </view>
      <!-- 第二行：左侧标题 + 右侧操作按钮 -->
      <view class="nav-row-bottom">
        <view class="nav-title nav-title-btn" @tap="goToCalendar">📅 打卡日历</view>
        <view class="nav-actions">
          <!-- 铃铛 → 通知中心 -->
          <view class="circle-btn bell-btn" @tap="goNotification">
            <text class="bell-icon">🔔</text>
          </view>
          <!-- ＋号 → 新建事项 -->
          <view class="circle-btn plus-btn" @tap="goCreate">
            <text class="plus-icon">＋</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== ② 横向近7日日期滑动条（★ 核心新增）====== -->
    <view class="date-strip-wrap" @tap="goToCalendar">
      <scroll-view class="date-scroll" scroll-x :show-scrollbar="false">
        <!-- ★ 内层flex行容器：确保 uni-app x 下横向排布 -->
        <view class="date-row">
          <view
            v-for="d in recentDays"
            :key="d.date"
            class="date-chip"
            :class="getDayChipClass(d)"
            @tap.stop="selectDate(d.date)"
          >
            <text class="chip-week">{{ d.weekLabel }}</text>
            <text class="chip-day">{{ d.dayNum }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- ====== ③ 三格统计卡片（今日待打 / 已完成 / 逾期）====== -->
    <view class="stats-row" v-if="itemsView.length > 0 || stats.done > 0">
      <view class="stat-card stat-todo">
        <text class="stat-num">{{ stats.total - stats.done - stats.overdue }}</text>
        <text class="stat-label">今日待打</text>
      </view>
      <view class="stat-card stat-done">
        <text class="stat-num">{{ stats.done }}</text>
        <text class="stat-label">已完成</text>
      </view>
      <view class="stat-card stat-overdue">
        <text class="stat-num">{{ stats.overdue }}</text>
        <text class="stat-label">逾期</text>
      </view>
    </view>

    <!-- ====== ④ 当日事项卡片列表（★ 完整5种状态）====== -->
    <scroll-view class="item-list" scroll-y>
      <!-- 空状态引导 -->
      <view v-if="itemsView.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">今天没有待办事项</text>
        <text class="empty-link" @tap="goCreate">＋ 新建打卡事项</text>
      </view>

      <!-- 类型A: 待打卡 / 已完成 / 已逾期 / 暂停 / 未来 -->
      <view
        v-for="item in itemsView"
        :key="item._id"
        class="item-card dk-card"
        :class="{ 'card-paused': item.viewType === 'paused', 'card-future': item.viewType === 'future' }"
        @longpress="onLongPressItem(item)"
      >
        <!-- 卡片头部（★ 可点击跳转详情）-->
        <view class="item-head" @tap="goToDetail(item)">
          <view class="head-left">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-subtitle">{{ item.subtitle }}</text>
          </view>
          <!-- 徽标区 -->
          <text v-if="item.viewType === 'done'" class="badge badge-done">已完成</text>
          <text v-else-if="item.viewType === 'todo'" class="badge badge-todo">待打卡</text>
          <text v-else-if="item.viewType === 'overdue'" class="badge badge-overdue">已逾期</text>
          <text v-else-if="item.viewType === 'paused'" class="badge badge-paused">已暂停</text>
          <text v-else-if="item.viewType === 'future'" class="badge badge-todo">待打卡</text>
        </view>

        <!-- 待打卡卡片底部：完成打卡按钮 -->
        <view
          v-if="item.viewType === 'todo'"
          class="card-action-row"
          @tap="doCheckin(item)"
        >
          <text class="checkin-btn-text">✓ 完成打卡</text>
        </view>

        <!-- 已完成卡片底部：仅显示打卡时间 -->
        <view v-if="item.viewType === 'done'" class="item-meta-row">
          <text class="meta-left" v-if="item.lastCheckTime">{{ item.lastCheckTime }} 打卡</text>
        </view>
        <view
          v-if="item.viewType === 'overdue' && item.canMakeup"
          class="makeup-btn"
          @tap="doMakeup(item)"
        >
          <text class="makeup-btn-text">补打卡</text>
        </view>

        <!-- 已暂停卡片底部：暂停提示 -->
        <view v-if="item.viewType === 'paused'" class="paused-hint-row">
          <text class="paused-hint-text">已暂停 · 点击恢复或进入详情管理</text>
        </view>

        <!-- 已逾期 + 超时不可补：置灰 -->
        <view
          v-if="item.viewType === 'overdue' && !item.canMakeup"
          class="makeup-btn makeup-disabled"
        >
          <text class="makeup-btn-text">已超时</text>
        </view>
      </view>

      <!-- 底部安全距离（TabBar 避让） -->
      <view style="height: 100rpx;" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  formatDate,
  dateOffset,
  weekText,
  shouldCheckinToday,
  calcDayStatus,
  calcConsecutiveDays,
  canMakeup,
  repeatText
} from '@/utils/checkin-utils.js'

// ---- 常量 ----
const todayStr = formatDate(new Date())

// ---- 响应式状态 ----
const selectedDate = ref(todayStr)
const recentDays = ref([])
const allItems = ref([])
const recordsMap = ref({})
const itemsView = ref([])
const loading = ref(false)
const lastCheckTime = ref('')
const statusBarHeight = ref(0)  // ★ 状态栏高度（自定义导航栏适配）

// 统计数据
const stats = ref({ done: 0, total: 0, overdue: 0 })

// ======================== 数据加载 ========================

/** 获取系统信息（状态栏高度等） */
function initSystemInfo() {
  try {
    const windowInfo = wx.getWindowInfo()
    statusBarHeight.value = windowInfo.statusBarHeight || 0
  } catch (e) {
    statusBarHeight.value = 0
  }
}

async function loadData() {
  const db = wx.cloud.database()
  const _ = db.command

  loading.value = true
  uni.showLoading({ title: '加载中' })

  try {
    const start = dateOffset(todayStr, -30)
    const end = dateOffset(todayStr, 7)

    const itemsQ = db.collection('checkin_items')
      .where(_.or([{ status: 'active' }, { status: 'paused' }]))
    const recordsQ = db.collection('checkin_records')
      .where({ date: _.gte(start).and(_.lte(end)) })

    const [itemRes, recordRes] = await Promise.all([
      itemsQ.get({ fetchOptions: { fromCache: false } }),
      recordsQ.orderBy('checkedAt', 'desc').get({ fetchOptions: { fromCache: false } })
    ])

    const finalRecords = recordRes.data || []

    allItems.value = itemRes.data || []

    // ★ 诊断日志：确认拉到的数据量和每周类型事项
    console.log('📊 [index] 数据加载完成:')
    console.log('📊 [index]   事项总数 =', allItems.value.length)
    if (allItems.value.length > 0) {
      allItems.value.forEach((item) => {
        console.log(`📊 [index]   - ${item.name} | repeatType=${item.repeatType} | status=${item.status} | days=${JSON.stringify(item.repeatDays || [])}`)
      })
    }

    // 构建记录映射
    const map = {}
    finalRecords.forEach((record) => {
      map[`${record.itemId}_${record.date}`] = record
    })
    recordsMap.value = map

    // 获取最后一次打卡时间（最近的记录，按 checkedAt 降序第一条）
    if (finalRecords.length > 0) {
      const latest = finalRecords[0]
      if (latest.checkedAt) {
        let ts = 0
        if (typeof latest.checkedAt === 'string') {
          ts = new Date(latest.checkedAt).getTime()
        } else if (latest.checkedAt instanceof Date) {
          ts = latest.checkedAt.getTime()
        } else if (latest.checkedAt && typeof latest.checkedAt === 'object' && latest.checkedAt.seconds) {
          ts = latest.checkedAt.seconds * 1000
        }
        if (ts > 0) {
          const d = new Date(ts)
          lastCheckTime.value = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        }
      }
    }

    buildRecentDays()
    rebuildList()
  } catch (error) {
    console.error('loadData error', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    uni.hideLoading()
  }
}

// ======================== 日期条构建 ========================

function buildRecentDays() {
  const list = []

  for (let i = 6; i >= 0; i -= 1) {
    const dateStr = dateOffset(todayStr, -i)
    const dayInfo = calcDayStatus(allItems.value, recordsMap.value, dateStr, todayStr)

    list.push({
      date: dateStr,
      dayNum: Number(dateStr.slice(8)),
      weekLabel: dateStr === todayStr ? '今' : weekText(dateStr),
      isToday: dateStr === todayStr,
      status: dayInfo.status,
      dueCount: dayInfo.dueCount,
      doneCount: dayInfo.doneCount
    })
  }

  recentDays.value = list
}

function getDayChipClass(d) {
  // ★ 选中日期优先显示蓝色（最高优先级）
  if (d.date === selectedDate.value) return 'chip-today'
  switch (d.status) {
    case 'done': return 'chip-done'
    case 'overdue': return 'chip-overdue'
    case 'partial': return 'chip-partial'
    default: return 'chip-none'
  }
}

// ======================== 事项列表构建 ========================

function rebuildList() {
  const currentDateStr = selectedDate.value
  const currentDateObj = new Date(`${currentDateStr}T00:00:00`)
  const isToday = currentDateStr === todayStr
  const isFuture = currentDateStr > todayStr

  let todo = 0
  let done = 0
  let overdue = 0

  const list = []

  allItems.value.forEach((item) => {
    // ★ 暂停状态的事项直接标记为paused，跳过后续打卡判断
    if (item.status === 'paused') {
      console.log(`⏭️ [index] 跳过暂停项: ${item.name}`)
      list.push({
        ...item,
        viewType: 'paused',
        subtitle: '暂停中 · 剩余次数计算已暂停',
        canMakeup: false,
        checkCount: 0,
        lastCheckTime: ''
      })
      return
    }

    // ★ 已完成目标的事项不再出现在每日待打卡列表中
    if (item.status === 'completed') {
      console.log(`✅ [index] 跳过已完成项: ${item.name}（已达成目标）`)
      return
    }

    // 判断该事项是否应该在选中日期打卡
    const should = shouldCheckinToday(item, currentDateObj)
    
    // ★ 诊断日志：打印每个事项的判断结果（特别关注 daily / weekly 类型）
    if (item.repeatType === 'weekly') {
      const weekday = currentDateObj.getDay()
      console.log(`🔍 [index] 判断 "${item.name}" (weekly):`)
      console.log(`🔍 [index]   repeatDays = ${JSON.stringify(item.repeatDays)}, 今天星期${weekday}(${['日','一','二','三','四','五','六'][weekday]}), should = ${should}`)
    } else if (item.repeatType === 'daily' || item.repeatType === 'once') {
      console.log(`🔍 [index] 判断 "${item.name}" (${item.repeatType}): planDate=${item.planDate || '无'}, createdAt=${typeof item.createdAt}/${item.createdAt}, should = ${should}`)
    }
    
    if (!should) return

    const checked = !!recordsMap.value[`${item._id}_${currentDateStr}`]

    let viewType = 'todo'
    const extra = {}

    if (checked) {
      viewType = 'done'
      done += 1
      extra.consecutiveDays = calcConsecutiveDays(item._id, recordsMap.value, allItems.value, todayStr)

      // ★ 仅提取最新打卡时间（用于底部显示 HH:mm 打卡）
      let latestTimestamp = 0
      Object.values(recordsMap.value).forEach((rec) => {
        if (rec.itemId === item._id && rec.checkedAt) {
          let ts = 0
          if (typeof rec.checkedAt === 'string') {
            ts = new Date(rec.checkedAt).getTime()
          } else if (rec.checkedAt instanceof Date) {
            ts = rec.checkedAt.getTime()
          } else if (rec.checkedAt && typeof rec.checkedAt === 'object' && rec.checkedAt.seconds) {
            ts = rec.checkedAt.seconds * 1000
          }
          if (ts > latestTimestamp) latestTimestamp = ts
        }
      })

      // ★ 将最新时间戳转为 HH:mm 格式
      if (latestTimestamp > 0) {
        const d = new Date(latestTimestamp)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        extra.lastCheckTime = `${hh}:${mm}`
      } else {
        extra.lastCheckTime = ''
      }
    } else if (currentDateStr < todayStr) {
      viewType = 'overdue'
      overdue += 1
    } else if (isFuture) {
      viewType = 'future'
    } else {
      viewType = 'todo'
      todo += 1

      // ★ 待打卡：计算当前连续天数（含之前已连续的）
      extra.currentConsecutive = calcConsecutiveDays(item._id, recordsMap.value, allItems.value, todayStr)
    }

    // 补打卡判断
    const makeupAllowed = viewType === 'overdue' ? canMakeup(currentDateStr, todayStr) : false

    // ★ 副标题统一：频率·连续X天（当前连续天数不中断）
    const freq = repeatText(item)
    let subtitle = ''

    switch (viewType) {
      case 'done': {
        // 已完成：频率·连续N天
        const cons = extra.consecutiveDays || 0
        subtitle = cons > 0 ? `${freq}·连续${cons}天` : freq
        break
      }
      case 'todo': {
        // 待打卡：频率·连续N天（当前已连续的历史天数）
        const cons = extra.currentConsecutive || 0
        subtitle = cons > 0 ? `${freq}·连续${cons}天` : freq
        break
      }
      case 'overdue':
        // 已逾期：仅显示频率（已断签不加连续天数）
        subtitle = freq
        break
      case 'paused':
        // 已暂停
        subtitle = '暂停中'
        break
      default:
        subtitle = freq
    }

    list.push({
      ...item,
      viewType,
      subtitle,
      canMakeup: makeupAllowed,
      // ★ 仅保留必要字段，移除 checkCount/checkinRate
      lastCheckTime: extra.lastCheckTime || '',
      consecutiveDays: extra.consecutiveDays || 0,
      currentConsecutive: extra.currentConsecutive || 0
    })
  })

  stats.value = { done, total: done + todo + overdue, overdue }
  itemsView.value = list
  console.log(`📋 [index] rebuildList 完成: itemsView.length = ${list.length}, listHeight = ${listHeight.value}`)
}

// ======================== 交互操作 ========================

/** 选择某一天 */
function selectDate(dateStr) {
  selectedDate.value = dateStr
  rebuildList()
}

/** 执行打卡 */
async function doCheckin(item) {
  const db = wx.cloud.database()

  if (selectedDate.value !== todayStr) {
    uni.showToast({ title: '仅支持当日打卡', icon: 'none' })
    return
  }

  // 检查是否已有记录
  const exists = await db
    .collection('checkin_records')
    .where({ itemId: item._id, date: selectedDate.value })
    .limit(1)
    .get()

  if (exists.data.length) {
    uni.showToast({ title: '今天已打卡', icon: 'none' })
    return
  }

  // ★ 诊断日志：确认写入时的日期值
  console.log('🏠 [index] 准备写入打卡记录:')
  console.log('🏠 [index]   itemId =', item._id)
  console.log('🏠 [index]   date(selectedDate.value) =', selectedDate.value)
  console.log('🏠 [index]   todayStr =', todayStr)
  console.log('🏠 [index]   两者是否一致?', selectedDate.value === todayStr)

  await db.collection('checkin_records').add({
    data: {
      itemId: item._id,
      date: selectedDate.value,
      checkedAt: new Date(),
      isPrompted: false,
      isMakeup: false
    }
  })

  console.log('🏠 [index] 写入成功，date =', selectedDate.value)

  uni.showToast({ title: '打卡成功 ✨', icon: 'success' })

  await loadData()

  // ★ 检查目标达成：如果设置了 targetCount 且已打卡次数 >= 目标，自动标记为已完成
  if (item.targetCount && item.targetCount > 0) {
    // 统计该事项的总打卡记录数（从 fresh 的 recordsMap 中）
    let totalCount = 0
    Object.values(recordsMap.value).forEach((rec) => {
      if (rec.itemId === item._id) totalCount += 1
    })
    if (totalCount >= item.targetCount) {
      try {
        await db.collection('checkin_items').doc(item._id).update({
          data: { status: 'completed' }
        })
        console.log(`🎯 [index] 「${item.name}」已达成目标(${totalCount}/${item.targetCount})，标记为 completed`)
        uni.showModal({
          title: '🎉 达成目标！',
          content: `「${item.name}」已累计打卡 ${totalCount} 次，达成目标！`,
          showCancel: false,
          confirmText: '太棒了'
        })
        await loadData()
      } catch (e) {
        console.error('更新完成状态失败', e)
      }
    }
  }

  // 检查是否全部完成
  if (
    selectedDate.value === todayStr &&
    stats.value.todo === 0 &&
    stats.value.overdue === 0 &&
    allItems.value.length > 0
  ) {
    setTimeout(() => {
      uni.showModal({
        title: '🎉 今日全部完成！',
        content: '太棒了，继续保持！',
        showCancel: false,
        confirmText: '好的'
      })
    }, 300)
  }
}

/** 补打卡 */
async function doMakeup(item) {
  const db = wx.cloud.database()

  const res = await new Promise((resolve) => {
    uni.showModal({
      title: '确认补打卡',
      content: `确定补打「${item.name}」${selectedDate.value} 的打卡记录？`,
      success: (e) => resolve(e),
      fail: () => resolve({ confirm: false })
    })
  })

  if (!res.confirm) return

  // 检查是否已有记录
  const exists = await db
    .collection('checkin_records')
    .where({ itemId: item._id, date: selectedDate.value })
    .limit(1)
    .get()

  if (exists.data.length) {
    uni.showToast({ title: '该日已有打卡记录', icon: 'none' })
    return
  }

  await db.collection('checkin_records').add({
    data: {
      itemId: item._id,
      date: selectedDate.value,
      checkedAt: new Date(),
      isPrompted: false,
      isMakeup: true // 补打卡标记
    }
  })

  uni.showToast({ title: '补打卡成功', icon: 'success' })
  await loadData()

  // ★ 补打卡后同样检测目标达成
  if (item.targetCount && item.targetCount > 0) {
    let totalCount = 0
    Object.values(recordsMap.value).forEach((rec) => {
      if (rec.itemId === item._id) totalCount += 1
    })
    if (totalCount >= item.targetCount) {
      try {
        await db.collection('checkin_items').doc(item._id).update({
          data: { status: 'completed' }
        })
        console.log(`🎯 [index] 「${item.name}」补打后达成目标(${totalCount}/${item.targetCount})，标记为 completed`)
        uni.showModal({
          title: '🎉 达成目标！',
          content: `「${item.name}」已累计打卡 ${totalCount} 次，达成目标！`,
          showCancel: false,
          confirmText: '太棒了'
        })
        await loadData()
      } catch (e) {
        console.error('更新完成状态失败', e)
      }
    }
  }
}

/** 长按卡片弹出菜单 */
function onLongPressItem(item) {
  // ★ 根据状态显示不同菜单选项
  const isCompleted = item.status === 'completed'
  const itemList = isCompleted
    ? ['重新激活该事项', '编辑事项', '删除事项']
    : ['暂停该事项', '编辑事项', '删除事项']

  uni.showActionSheet({
    itemList,
    success: async (res) => {
      if (isCompleted) {
        switch (res.tapIndex) {
          case 0:
            await resumeCompletedItem(item)
            break
          case 1:
            uni.navigateTo({ url: `/pages/checkin/detail?id=${item._id}` })
            break
          case 2:
            await deleteItem(item)
            break
        }
      } else {
        switch (res.tapIndex) {
          case 0:
            await pauseItem(item)
            break
          case 1:
            uni.navigateTo({ url: `/pages/checkin/detail?id=${item._id}` })
            break
          case 2:
            await deleteItem(item)
            break
        }
      }
    }
  })
}

/** 暂停事项 */
async function pauseItem(item) {
  const db = wx.cloud.database()

  const r = await new Promise((resolve) => {
    uni.showModal({
      title: `暂停「${item.name}」`,
      content: '暂停后该事项不会出现在每日待打卡列表中，可随时恢复。',
      success: (e) => resolve(e),
      fail: () => resolve({ confirm: false })
    })
  })
  if (!r.confirm) return

  try {
    await db.collection('checkin_items').doc(item._id).update({
      data: { status: 'paused' }
    })
    uni.showToast({ title: '已暂停', icon: 'none' })
    await loadData()
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

/** 重新激活已完成事项 */
async function resumeCompletedItem(item) {
  const db = wx.cloud.database()

  const r = await new Promise((resolve) => {
    uni.showModal({
      title: `激活「${item.name}」`,
      content: '激活后该事项将重新出现在每日待打卡列表中，目标次数将重置计算。',
      success: (e) => resolve(e),
      fail: () => resolve({ confirm: false })
    })
  })
  if (!r.confirm) return

  try {
    await db.collection('checkin_items').doc(item._id).update({
      data: { status: 'active' }
    })
    uni.showToast({ title: '已激活', icon: 'none' })
    await loadData()
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

/** 删除事项 */
async function deleteItem(item) {
  const db = wx.cloud.database()

  const r = await new Promise((resolve) => {
    uni.showModal({
      title: `删除「${item.name}」`,
      content: '删除后不可恢复，相关打卡记录也会被清除。',
      confirmColor: '#FF3B30',
      success: (e) => resolve(e),
      fail: () => resolve({ confirm: false })
    })
  })
  if (!r.confirm) return

  try {
    // 同时删除关联的打卡记录
    await db.collection('checkin_records')
      .where({ itemId: item._id })
      .remove()
    await db.collection('checkin_items').doc(item._id).remove()
    uni.showToast({ title: '已删除', icon: 'none' })
    await loadData()
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// ======================== 导航跳转 ========================

/** 单击卡片跳转到事项详情页（S5） */
function goToDetail(item) {
  uni.navigateTo({ url: `/pages/checkin/detail?id=${item._id}` })
}

function goToCalendar() {
  uni.navigateTo({ url: `/pages/checkin/calendar?date=${selectedDate.value}` })
}

function goNotification() {
  uni.navigateTo({ url: '/pages/mine/notification' })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/checkin/create' })
}

// ======================== 生命周期 ========================

onShow(() => {
  console.log('🔄 [index] onShow 触发，开始加载数据...')
  initSystemInfo()
  selectedDate.value = todayStr
  loadData()
})
</script>

<style scoped lang="scss">
@import "@/uni.scss";

.page {
  display: flex;
  flex-direction: column;        /* ★ uni-app x 必须显式声明 */
  height: 100vh;                 /* ★ 固定视口高度，不再用 min-height */
  padding: 20rpx 16rpx 0;
  background-color: $dk-bg;
  box-sizing: border-box;
  overflow: hidden;              /* ★ 防止内容溢出页面 */

/* ========== ① 顶部导航栏（★ 双行：居中标题行 + 左标题+右按钮行）========== */
.top-nav {
  position: relative;
  display: flex;
  flex-direction: column;        /* ★ 改为纵向排列：两行上下堆叠 */
  margin-bottom: 16rpx;
  width: 100%;
}

/* ====== 第一行：居中导航标题（与微信胶囊同行）====== */
.nav-row-top {
  display: flex;
  flex-direction: row;
  justify-content: center;       /* 水平居中 */
  align-items: center;           /* 垂直居中 */
  height: 64rpx;                 /* 与胶囊按钮等高 */
}

/* 居中导航标题 */
.nav-center-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1A2033;
  white-space: nowrap;
}

/* ====== 第二行：左侧标题 + 右侧按钮====== */
.nav-row-bottom {
  display: flex;
  flex-direction: row;           /* ★ uni-app x 必须显式声明 */
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0 12rpx 0;       /* 两行之间的间距 + 底部留白 */
}

.nav-title {
  font-size: 44rpx;              /* 左侧大字标题 */
  font-weight: 800;
  color: #1A2033;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 打卡日历按钮可点击样式 */
.nav-title-btn {
  cursor: pointer;
}
.nav-title-btn:active {
  opacity: 0.7;
}

.nav-actions {
  display: flex;
  flex-direction: row;
  gap: 16rpx;                  /* ★ 加大按钮间距 */
  align-items: center;
  flex-shrink: 0;
}

.circle-btn {
  width: 80rpx;                /* ★ 放大按钮尺寸 72→80 */
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;              /* ★ 单个按钮也不被压缩 */
}

.bell-btn {
  background: #F8F9FB;
  border: 2rpx solid #E4E8F0; /* ★ 边框略粗更清晰 */
}

.bell-icon {
  font-size: 34rpx;            /* ★ 放大铃铛图标 28→34 */
}

.plus-btn {
  background: #4F7CFF;
}

.plus-icon {
  font-size: 40rpx;            /* ★ 放大＋号 34→40 */
  color: #fff;
  font-weight: 700;
}

/* ========== ② 横向日期条（uni-app x / UTS 兼容版）========== */
.date-strip-wrap {
  position: relative;           /* ★ 为浮动＋号提供定位参考 */
  padding: 0 0 16rpx;
  cursor: pointer;
}

/* scroll-view 本身不设 display:flex，避免破坏 UTS 渲染 */
.date-scroll {
  width: 100%;
  padding: 0 8rpx;
}

/* ★ 内层行容器负责横排 */
.date-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
}

.date-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 88rpx;             /* ★ 微调：略放宽接近正方形 */
  height: 88rpx;
  padding: 8rpx 6rpx;       /* ★ 减少内边距，让内容更紧凑 */
  border-radius: 24rpx;
  margin-right: 12rpx;
}

.chip-week {
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1.2;
}

.chip-day {
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.2;
  margin-top: 2rpx;
}

/* 今天 — 蓝色高亮（最高优先级） */
.chip-today {
  background: #4F7CFF;
  color: #FFFFFF;
}
.chip-today .chip-week,
.chip-today .chip-day { color: #fff; }

/* 全完成 — 绿色 */
.chip-done {
  background: #EDFAF2;
  color: #34C759;
}

/* 有逾期 — 红色 */
.chip-overdue {
  background: #FFF0EF;
  color: #FF3B30;
}

/* 部分完成 — 橙色 */
.chip-partial {
  background: #FFF5E6;
  color: #FF9500;
}

/* 无事项 / 未来 — 灰色 */
.chip-none {
  background: #F0F2F7;
  color: #6B7A99;
}

/* ★ 日期栏右侧浮动＋号按钮 */
.fab-plus {
  position: absolute;
  right: 0;
  bottom: 8rpx;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #4F7CFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(79, 124, 255, 0.35);
}

.fab-plus-icon {
  font-size: 36rpx;
  color: #FFFFFF;
  font-weight: 700;
}

/* ========== ③ 三格统计卡片 ========== */
.stats-row {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 0 8rpx 24rpx;
}

.stat-card {
  flex: 1;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 20rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #F0F2F7;
}

.stat-num {
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 4rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #9AA5BE;
  font-weight: 500;
}

/* 三格颜色 */
.stat-todo .stat-num { color: #4F7CFF; }
.stat-done .stat-num { color: #34C759; }
.stat-overdue .stat-num { color: #FF3B30; }

/* ========== ④ 事项列表 ========== */
.item-list {
  flex: 1;                       /* ★ 占据剩余空间（flex 布局下自动计算） */
  overflow-y: auto;              /* ★ 确保可滚动 */
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 0 40rpx;
}

.empty-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #6B7A99;
  display: block;
  margin-bottom: 16rpx;
}

.empty-link {
  font-size: 28rpx;
  color: #4F7CFF;
  font-weight: 600;
}

/* 卡片基础样式 — 更紧凑 */
.item-card {
  background: #fff;
  border-radius: 24rpx;           /* ★ 圆角略小更紧凑 */
  padding: 24rpx 28rpx;           /* ★ 减少内边距 */
  margin-bottom: 16rpx;           /* ★ 减少间距 */
  border: 1.5rpx solid #F0F2F7;
}

.card-paused {
  opacity: 0.55;
}

.card-future {
  opacity: 0.75;
}

.item-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  /* ★ 去掉margin-bottom，头部和底部信息紧贴 */
}

.head-left {
  flex: 1;
  min-width: 0; /* 允许文字截断 */
  margin-right: 20rpx;        /* ★ 增大与右侧徽标间距 */
}

.item-name {
  display: block;
  font-size: 32rpx;           /* ★ 标题略大 */
  font-weight: 700;
  color: #1A2033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-subtitle {
  display: block;
  font-size: 24rpx;
  color: #9AA5BE;
  margin-top: 8rpx;           /* ★ 名称与副标题间距 */
}

/* 徽标 */
.badge {
  font-size: 22rpx;
  font-weight: 600;
  border-radius: 40rpx;
  padding: 8rpx 20rpx;        /* ★ 略大内边距 */
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-done {
  color: #34C759;
  background: #EDFAF2;
}

.badge-todo {
  color: #4F7CFF;
  background: #EEF2FF;
}

.badge-overdue {
  color: #FF3B30;
  background: #FFF0EF;
}

.badge-paused {
  color: #6B7A99;
  background: #F0F2F7;
}

/* 已完成卡片底部信息行（★ 单行：仅显示时间） */
.item-meta-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #E8EAEE;
}

.meta-left {
  font-size: 24rpx;
  color: #9AA5BE;
  font-weight: 500;
}

/* 已暂停卡片底部提示行 */
.paused-hint-row {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #E8EAEE;
}

.paused-hint-text {
  font-size: 24rpx;
  color: #9AA5BE;
}

/* ★ 待打卡卡片底部：完成打卡操作行 */
.card-action-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: #4F7CFF;
  border-radius: 16rpx;
  padding: 22rpx 0;
  margin-top: 20rpx;
  padding-top: 20rpx;          /* 与 meta-row 对齐 */
  border-top: none;           /* 不加分隔线，纯色块 */
}

.card-action-row:active {
  opacity: 0.8;               /* 按下反馈 */
}

.checkin-btn-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 2rpx;
}

/* 补打卡按钮 */
.makeup-btn {
  width: 100%;
  background: #F0F2F7;
  border-radius: 16rpx;
  padding: 20rpx;
  text-align: center;
  margin-top: 12rpx;
}

.makeup-btn-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #6B7A99;
}

.makeup-disabled {
  opacity: 0.45;
}
</style>
