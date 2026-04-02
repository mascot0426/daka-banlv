<template>
  <view class="page">
    <view v-if="item._id" class="content">
      <view class="info-card">
        <view class="info-header">
          <text class="info-name">{{ item.name }}</text>
          <view class="status-badge" :class="getStatusClass(item.status)">
            <text>{{ getStatusLabel(item.status) }}</text>
          </view>
        </view>
        <view class="info-row"><text class="info-key">重复规则</text><text class="info-val">{{ formatRepeat(item) }}</text></view>
        <view class="info-row" v-if="item.remindTime"><text class="info-key">提醒时间</text><text class="info-val">{{ item.remindTime }}</text></view>
        <view class="info-row" v-if="item.description"><text class="info-key">执行说明</text><text class="info-val">{{ item.description }}</text></view>
        <view class="info-row" v-if="item.remark"><text class="info-key">备注</text><text class="info-val">{{ item.remark }}</text></view>
        <view class="info-row" v-if="item.targetCount"><text class="info-key">目标次数</text><text class="info-val">{{ item.targetCount }} 次</text></view>
        <view class="info-row" v-if="item.planDate"><text class="info-key">目标日期</text><text class="info-val">{{ item.planDate }}</text></view>
      </view>
      <view class="stats-card">
        <view class="stat-cell"><text class="stat-val green">{{ stats.done }}</text><text class="stat-lbl">已完成</text></view>
        <view class="stat-divider" />
        <view class="stat-cell"><text class="stat-val orange">{{ stats.overdue }}</text><text class="stat-lbl">已逾期</text></view>
        <view class="stat-divider" />
        <view class="stat-cell"><text class="stat-val blue">{{ stats.rate }}%</text><text class="stat-lbl">完成率</text></view>
      </view>
      <view class="actions">
        <view v-if="item.status === 'active'" class="action-btn action-btn--pause" @tap="pauseItem"><text>暂停</text></view>
        <view v-if="item.status === 'paused'" class="action-btn action-btn--resume" @tap="resumeItem"><text>恢复</text></view>
        <view v-if="item.status === 'active'" class="action-btn action-btn--archive" @tap="archiveItem"><text>归档</text></view>
      </view>
    </view>
    <view v-else class="loading"><text>加载中...</text></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const item = ref({})
const stats = ref({ done: 0, overdue: 0, rate: 0 })

function getStatusLabel(s) {
  return { active: '进行中', paused: '已暂停', archived: '已归档' }[s] || s
}
function getStatusClass(s) {
  return { active: 'badge--green', paused: 'badge--gray', archived: 'badge--orange' }[s] || 'badge--gray'
}
function formatRepeat(it) {
  return { daily: '每天', weekly: '每周', monthly: '每月', once: '仅一次' }[it.repeatType] || it.repeatType
}
function pauseItem() {
  uni.showModal({
    title: '暂停确认', content: '暂停后该事项将从打卡列表隐藏，是否继续？',
    success(res) {
      if (res.confirm) { item.value.status = 'paused'; uni.showToast({ title: '已暂停', icon: 'success' }) }
    }
  })
}
function resumeItem() {
  item.value.status = 'active'
  uni.showToast({ title: '已恢复', icon: 'success' })
}
function archiveItem() {
  uni.showModal({
    title: '确认归档', content: '归档后事项移出打卡列表，历史记录保留。确认归档？',
    success(res) {
      if (res.confirm) {
        uni.showToast({ title: '已归档', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1000)
      }
    }
  })
}
onMounted(() => {
  const pages = getCurrentPages()
  const id = pages[pages.length - 1]?.options?.id
  if (id) { /* TODO: 从云数据库按 id 加载事项详情 */ }
})
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; }
.content { display: flex; flex-direction: column; gap: 20rpx; }
.info-card { background: #fff; border-radius: 24rpx; padding: 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); }
.info-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.info-name { font-size: 32rpx; font-weight: 800; color: #2D3748; flex: 1; margin-right: 16rpx; }
.status-badge { padding: 6rpx 18rpx; border-radius: 20rpx; font-size: 22rpx; font-weight: 600; }
.badge--green { background: #EDFAF2; color: #34C759; }
.badge--gray { background: #F0F2F7; color: #9AA5BE; }
.badge--orange { background: #FFF5E6; color: #FF9500; }
.info-row { display: flex; padding: 10rpx 0; border-bottom: 1rpx solid #F0F2F7; }
.info-row:last-child { border-bottom: none; }
.info-key { font-size: 26rpx; color: #9AA5BE; width: 160rpx; flex-shrink: 0; }
.info-val { font-size: 26rpx; color: #2D3748; flex: 1; }
.stats-card { display: flex; align-items: center; background: #fff; border-radius: 24rpx; padding: 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); }
.stat-cell { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
.stat-val { font-size: 40rpx; font-weight: 800; }
.stat-val.green { color: #34C759; } .stat-val.orange { color: #FF9500; } .stat-val.blue { color: #4F7CFF; }
.stat-lbl { font-size: 22rpx; color: #9AA5BE; }
.stat-divider { width: 1rpx; height: 60rpx; background: #E4E8F0; }
.actions { display: flex; gap: 16rpx; }
.action-btn { flex: 1; text-align: center; padding: 24rpx; border-radius: 20rpx; font-size: 28rpx; font-weight: 700; }
.action-btn--pause { background: #FFF5E6; color: #FF9500; }
.action-btn--resume { background: #EDFAF2; color: #34C759; }
.action-btn--archive { background: #F0F2F7; color: #6B7A99; }
.loading { display: flex; justify-content: center; padding: 100rpx; color: #9AA5BE; }
</style>
