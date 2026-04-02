<template>
  <view class="page">
    <!-- S8: 协同主页 -->

    <view v-if="!privacyAgreed" class="privacy-tip-card">
      <text class="privacy-tip-title">协同功能暂不可用</text>
      <text class="dk-text-sub">请先同意隐私保护指引后再使用亲友协同功能</text>
    </view>

    <view v-if="pendingInvites.length > 0" class="section">
      <text class="dk-section-title">待处理</text>
      <view v-for="invite in pendingInvites" :key="invite._id" class="msg-card msg-card--blue">
        <view class="msg-left">
          <text class="msg-icon">🤝</text>
          <view class="msg-body">
            <text class="msg-title">收到协同绑定邀请</text>
            <text class="dk-text-sub">对方角色：{{ invite.senderRole === 'supervisor' ? '监督方' : '被监督方' }}</text>
          </view>
        </view>
        <view class="msg-actions">
          <view class="msg-btn msg-btn--gray" @tap="rejectInvite(invite)"><text>拒绝</text></view>
          <view class="msg-btn msg-btn--blue" @tap="confirmInvite(invite)"><text>确认</text></view>
        </view>
      </view>
    </view>

    <view v-if="pendingTodos.length > 0" class="section">
      <view v-for="todo in pendingTodos" :key="todo._id" class="msg-card msg-card--orange">
        <view class="msg-left">
          <text class="msg-icon">📋</text>
          <view class="msg-body">
            <text class="msg-title">{{ todo.name }}</text>
            <text class="dk-text-sub">来自亲友的待办事项</text>
          </view>
        </view>
        <view class="msg-actions">
          <view class="msg-btn msg-btn--gray" @tap="rejectTodo(todo)"><text>拒绝</text></view>
          <view class="msg-btn msg-btn--blue" @tap="confirmTodo(todo)"><text>接受</text></view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="dk-section-title">我的亲友</text>
      <view v-if="bindings.length === 0" class="dk-card empty-collab">
        <text class="dk-empty__icon">👥</text>
        <text class="dk-text-sub">还没有绑定的亲友</text>
      </view>
      <view v-for="binding in bindings" :key="binding._id" class="friend-card" @tap="goBoard(binding)">
        <view class="friend-avatar">
          <image v-if="binding.avatarUrl" :src="binding.avatarUrl" class="avatar-img" />
          <view v-else class="avatar-ph"><text>{{ (binding.nickname || '友')[0] }}</text></view>
        </view>
        <view class="friend-info">
          <text class="friend-name">{{ binding.nickname || '亲友' }}</text>
          <text class="dk-text-sub">{{ binding.myRole === 'supervisor' ? '我是监督方' : '我是被监督方' }}</text>
        </view>
        <view class="friend-stats">
          <text class="stats-rate">{{ binding.todayRate ?? '--' }}%</text>
          <text class="dk-text-xs">今日完成</text>
        </view>
        <text class="chevron">›</text>
      </view>
    </view>

    <view class="invite-entry" @tap="goInvite">
      <text class="invite-plus">＋</text>
      <text class="dk-text-sub">邀请新亲友</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const pendingInvites = ref([])
const pendingTodos = ref([])
const bindings = ref([])
const privacyAgreed = ref(true)

function ensurePrivacyAgreed(showTip = true) {
  const agreed = uni.getStorageSync('privacyAgreed') === true
  privacyAgreed.value = agreed

  if (!agreed && showTip) {
    uni.showToast({
      title: '请先同意隐私保护指引后再使用协同功能',
      icon: 'none'
    })
  }

  return agreed
}

function confirmInvite(invite) {
  if (!ensurePrivacyAgreed()) return
  uni.navigateTo({ url: `/pages/collab/join?code=${invite.inviteCode}` })
}

function rejectInvite() {
  if (!ensurePrivacyAgreed()) return
  uni.showToast({ title: '已拒绝', icon: 'none' })
}

function confirmTodo() {
  if (!ensurePrivacyAgreed()) return
  uni.showToast({ title: '已接受', icon: 'success' })
}

function rejectTodo() {
  if (!ensurePrivacyAgreed()) return
  uni.showToast({ title: '已拒绝', icon: 'none' })
}

function goBoard(binding) {
  if (!ensurePrivacyAgreed()) return
  uni.navigateTo({ url: `/pages/collab/dashboard?bindingId=${binding._id}` })
}

function goInvite() {
  if (!ensurePrivacyAgreed()) return
  uni.navigateTo({ url: '/pages/collab/invite' })
}

onShow(() => {
  ensurePrivacyAgreed(false)
})

onMounted(() => {
  // TODO: 从云数据库加载绑定关系与待处理消息
})
</script>

<style scoped>
.page { min-height: 100vh; background: #F8F9FB; padding: 24rpx; }
.section { margin-bottom: 32rpx; }
.privacy-tip-card {
  margin-bottom: 24rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: #FFF5E6;
  border: 2rpx solid #FDDCAA;
}
.privacy-tip-title {
  margin-bottom: 6rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #1A2033;
}
.msg-card {
  border-radius: 32rpx; padding: 28rpx 24rpx;
  margin-bottom: 16rpx; display: flex; flex-direction: column; gap: 20rpx;
}
.msg-card--blue   { background: #EEF2FF; border: 2rpx solid #C7D2FE; }
.msg-card--orange { background: #FFF5E6; border: 2rpx solid #FDDCAA; }
.msg-left  { display: flex; align-items: flex-start; gap: 16rpx; }
.msg-icon  { font-size: 40rpx; flex-shrink: 0; }
.msg-body  { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.msg-title { font-size: 28rpx; font-weight: 700; color: #1A2033; }
.msg-actions { display: flex; gap: 16rpx; justify-content: flex-end; }
.msg-btn {
  padding: 14rpx 32rpx; border-radius: 24rpx;
  font-size: 26rpx; font-weight: 600;
}
.msg-btn--gray { background: #F0F2F7; color: #4A5568; }
.msg-btn--blue { background: #4F7CFF; color: #FFFFFF; }
.empty-collab { display: flex; flex-direction: column; align-items: center; padding: 60rpx; gap: 16rpx; }
.friend-card {
  display: flex; align-items: center;
  background: #FFFFFF; border-radius: 32rpx;
  padding: 24rpx; margin-bottom: 16rpx;
  border: 2rpx solid #F0F2F7; gap: 16rpx;
}
.avatar-img { width: 80rpx; height: 80rpx; border-radius: 50%; }
.avatar-ph {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  background: #EEF2FF; display: flex; align-items: center;
  justify-content: center; font-size: 32rpx; color: #4F7CFF; font-weight: 700;
}
.friend-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.friend-name { font-size: 28rpx; font-weight: 700; color: #1A2033; }
.friend-stats { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; gap: 2rpx; }
.stats-rate { font-size: 28rpx; font-weight: 800; color: #4F7CFF; }
.chevron { font-size: 36rpx; color: #C8CFDE; flex-shrink: 0; }
.invite-entry {
  display: flex; flex-direction: column; align-items: center;
  padding: 40rpx; border: 2rpx dashed #C8CFDE;
  border-radius: 32rpx; gap: 12rpx; background: #FFFFFF;
}
.invite-plus { font-size: 48rpx; color: #9AA5BE; }
</style>
