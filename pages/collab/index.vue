<template>
  <view class="page dk-page">
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
  if (!agreed && showTip) uni.showToast({ title: '请先同意隐私保护指引后再使用协同功能', icon: 'none' })
  return agreed
}
function confirmInvite(invite) { if (!ensurePrivacyAgreed()) return; uni.navigateTo({ url: `/pages/collab/join?code=${invite.inviteCode}` }) }
function rejectInvite() { if (!ensurePrivacyAgreed()) return; uni.showToast({ title: '已拒绝', icon: 'none' }) }
function confirmTodo() { if (!ensurePrivacyAgreed()) return; uni.showToast({ title: '已接受', icon: 'success' }) }
function rejectTodo() { if (!ensurePrivacyAgreed()) return; uni.showToast({ title: '已拒绝', icon: 'none' }) }
function goBoard(binding) { if (!ensurePrivacyAgreed()) return; uni.navigateTo({ url: `/pages/collab/dashboard?bindingId=${binding._id}` }) }
function goInvite() { if (!ensurePrivacyAgreed()) return; uni.navigateTo({ url: '/pages/collab/invite' }) }

onShow(() => ensurePrivacyAgreed(false))
onMounted(() => {
  // TODO: 从云数据库加载绑定关系与待处理消息
})
</script>

<style scoped lang="scss">
@import "@/uni.scss";

.page { padding: 24rpx; }
.section { margin-bottom: 32rpx; }

.privacy-tip-card {
  margin-bottom: 24rpx; padding: 24rpx;
  border-radius: 20rpx; background: $dk-warn-light; border: 2rpx solid #FDDCAA;
}
.privacy-tip-title { margin-bottom: 6rpx; font-size: $dk-font-base; font-weight: 700; color: $dk-text-primary; }

.msg-card { border-radius: 32rpx; padding: 28rpx 24rpx; margin-bottom: 16rpx; display:flex; flex-direction:column; gap:20rpx; }
.msg-card--blue { background: $dk-brand-light; border:2rpx solid #C7D2FE; }
.msg-card--orange { background: $dk-warn-light; border:2rpx solid #FDDCAA; }
.msg-left { display:flex; align-items:flex-start; gap:16rpx; }
.msg-icon { font-size: 40rpx; }
.msg-body { flex:1; display:flex; flex-direction:column; gap:4rpx; }
.msg-title { font-size: $dk-font-base; font-weight: 700; color: $dk-text-primary; }
.msg-actions { display:flex; gap:16rpx; justify-content:flex-end; }

.msg-btn { padding:14rpx 32rpx; border-radius:24rpx; font-size:26rpx; font-weight:600; }
.msg-btn--gray { background:$dk-divider; color:#4A5568; }
.msg-btn--blue { background:$dk-brand; color:#fff; }

.empty-collab { display:flex; flex-direction:column; align-items:center; padding:60rpx; gap:16rpx; }

.friend-card {
  display:flex; align-items:center; gap:16rpx;
  background:#fff; border-radius:32rpx; padding:24rpx; margin-bottom:16rpx;
  border:2rpx solid $dk-divider; box-shadow:$dk-shadow-sm;
}
.avatar-img { width:80rpx; height:80rpx; border-radius:50%; }
.avatar-ph {
  width:80rpx; height:80rpx; border-radius:50%;
  background:$dk-brand-light; color:$dk-brand;
  display:flex; align-items:center; justify-content:center;
  font-size:32rpx; font-weight:700;
}
.friend-info { flex:1; display:flex; flex-direction:column; gap:4rpx; }
.friend-name { font-size:$dk-font-base; font-weight:700; color:$dk-text-primary; }
.friend-stats { display:flex; flex-direction:column; align-items:center; gap:2rpx; }
.stats-rate { font-size:$dk-font-base; font-weight:800; color:$dk-brand; }
.chevron { font-size:36rpx; color:#C8CFDE; }

.invite-entry {
  display:flex; flex-direction:column; align-items:center; gap:12rpx;
  padding:40rpx; border:2rpx dashed #C8CFDE; border-radius:32rpx; background:#fff;
}
.invite-plus { font-size:48rpx; color:$dk-text-disable; }
</style>
