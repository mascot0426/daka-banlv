<template>
  <view class="page">
    <!-- S16: 通知中心 -->
    <view class="section-card">
      <text class="section-title">通知开关</text>
      <view v-for="item in notifyItems" :key="item.key" class="notify-row">
        <view class="notify-left">
          <text class="notify-icon">{{ item.icon }}</text>
          <view class="notify-info">
            <text class="notify-label">{{ item.label }}</text>
            <text class="notify-desc">{{ item.desc }}</text>
          </view>
        </view>
        <view
          class="switch"
          :class="{ 'switch--on': item.enabled }"
          @tap="toggleNotify(item)"
        />
      </view>
    </view>

    <!-- 打卡提醒详情展开 -->
    <view v-if="checkinNotifyEnabled" class="section-card">
      <text class="section-title">各事项提醒时间</text>
      <view v-if="checkinItems.length === 0" class="empty-row">
        <text>暂无进行中的打卡事项</text>
      </view>
      <view v-for="ci in checkinItems" :key="ci._id" class="remind-row">
        <text class="remind-name">{{ ci.name }}</text>
        <picker mode="time" :value="ci.remindTime" @change="updateRemind(ci, $event.detail.value)">
          <view class="remind-time"><text>{{ ci.remindTime }}</text></view>
        </picker>
      </view>
    </view>

    <!-- 通知记录列表 -->
    <view class="section-card">
      <text class="section-title">最近通知</text>
      <view v-if="notifications.length === 0" class="empty-row">
        <text>暂无通知</text>
      </view>
      <view v-for="n in notifications" :key="n._id" class="notif-item" :class="{ 'notif-item--unread': !n.isRead }">
        <view class="notif-dot" v-if="!n.isRead" />
        <view class="notif-body">
          <text class="notif-content">{{ n.content }}</text>
          <text class="notif-time">{{ formatTime(n.createdAt) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const notifyItems = ref([
  { key: 'checkin', icon: '✅', label: '打卡提醒', desc: '在设定时间提醒你打卡', enabled: true },
  { key: 'overdue', icon: '⏰', label: '逾期提醒', desc: '次日提醒昨日未完成事项', enabled: true },
  { key: 'collab', icon: '🤝', label: '协同提醒', desc: '绑定邀请、关怀消息等', enabled: true },
  { key: 'system', icon: '📢', label: '系统通知', desc: '官方重要通知', enabled: true }
])
const checkinItems = ref([])
const notifications = ref([])

const checkinNotifyEnabled = computed(() =>
  notifyItems.value.find(i => i.key === 'checkin')?.enabled
)

function toggleNotify(item) {
  item.enabled = !item.enabled
  // TODO: 保存到云数据库用户配置
}

function updateRemind(ci, time) {
  ci.remindTime = time
  // TODO: 更新云数据库中该事项提醒时间
  uni.showToast({ title: '提醒时间已更新', icon: 'success' })
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  // TODO: 加载打卡事项列表和通知列表
})
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; display: flex; flex-direction: column; gap: 20rpx; }
.section-card { background: #fff; border-radius: 24rpx; padding: 28rpx 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); }
.section-title { font-size: 26rpx; font-weight: 700; color: #9AA5BE; display: block; margin-bottom: 16rpx; letter-spacing: 2rpx; }
.notify-row { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 8rpx; border-bottom: 1rpx solid #F0F2F7; }
.notify-row:last-child { border-bottom: none; }
.notify-left { display: flex; align-items: center; gap: 16rpx; flex: 1; }
.notify-icon { font-size: 36rpx; flex-shrink: 0; }
.notify-info { flex: 1; }
.notify-label { font-size: 28rpx; font-weight: 600; color: #2D3748; display: block; }
.notify-desc { font-size: 23rpx; color: #9AA5BE; display: block; margin-top: 4rpx; }
.switch { width: 92rpx; height: 56rpx; border-radius: 28rpx; background: #C8CFDE; position: relative; flex-shrink: 0; }
.switch::after { content: ''; position: absolute; width: 48rpx; height: 48rpx; background: #fff; border-radius: 50%; top: 4rpx; left: 4rpx; box-shadow: 0 2rpx 6rpx rgba(0,0,0,.2); transition: left 0.2s; }
.switch--on { background: #4F7CFF; }
.switch--on::after { left: 40rpx; }
.empty-row { padding: 20rpx 8rpx; font-size: 26rpx; color: #C8CFDE; text-align: center; }
.remind-row { display: flex; align-items: center; justify-content: space-between; padding: 18rpx 8rpx; border-bottom: 1rpx solid #F0F2F7; }
.remind-row:last-child { border-bottom: none; }
.remind-name { font-size: 27rpx; color: #2D3748; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.remind-time { background: #EEF2FF; color: #4F7CFF; padding: 8rpx 20rpx; border-radius: 12rpx; font-size: 26rpx; font-weight: 700; }
.notif-item { display: flex; align-items: flex-start; gap: 12rpx; padding: 16rpx 8rpx; border-bottom: 1rpx solid #F0F2F7; }
.notif-item:last-child { border-bottom: none; }
.notif-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #4F7CFF; flex-shrink: 0; margin-top: 8rpx; }
.notif-body { flex: 1; }
.notif-content { font-size: 27rpx; color: #2D3748; display: block; line-height: 1.5; }
.notif-time { font-size: 22rpx; color: #9AA5BE; display: block; margin-top: 6rpx; }
</style>
