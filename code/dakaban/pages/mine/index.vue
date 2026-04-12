<template>
  <view class="page">
    <!-- S14: 我的主页 -->

    <view class="profile-card">
      <view class="avatar-wrap">
        <image v-if="user.avatarUrl" :src="user.avatarUrl" class="avatar-img" />
        <view v-else class="avatar-ph"><text>😊</text></view>
      </view>
      <view class="profile-info">
        <text class="profile-name">{{ user.nickname || '打卡用户' }}</text>
        <text class="dk-text-sub">点击设置昵称（仅协同时可见）</text>
      </view>
    </view>

    <view class="stats-card">
      <view class="stat-cell">
        <text class="stat-val">{{ summary.totalCheckins }}</text>
        <text class="dk-text-xs">累计打卡</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-cell">
        <text class="stat-val">{{ summary.streakDays }}</text>
        <text class="dk-text-xs">连续天数</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-cell">
        <text class="stat-val">{{ summary.totalItems }}</text>
        <text class="dk-text-xs">事项总数</text>
      </view>
    </view>

    <view class="menu-group">
      <view class="menu-item" @tap="go('/pages/mine/notification')">
        <view class="menu-icon" style="background:#EEF2FF"><text>🔔</text></view>
        <text class="menu-label">通知中心</text>
        <view class="unread-badge" v-if="unreadCount > 0"><text>{{ unreadCount }}</text></view>
        <text class="chevron">›</text>
      </view>
      <view class="dk-divider" />
      <view class="menu-item" @tap="go('/pages/mine/privacy')">
        <view class="menu-icon" style="background:#EDFAF2"><text>🔒</text></view>
        <text class="menu-label">隐私设置</text>
        <text class="chevron">›</text>
      </view>
      <view class="dk-divider" />
      <view class="menu-item" @tap="go('/pages/privacy-modal/index')">
        <view class="menu-icon" style="background:#F5EEFF"><text>📄</text></view>
        <text class="menu-label">隐私保护指引</text>
        <text class="chevron">›</text>
      </view>
    </view>

    <view class="menu-group">
      <view class="menu-item" @tap="go('/pages/mine/delete-account')">
        <view class="menu-icon" style="background:#FFF0EF"><text>🗑️</text></view>
        <text class="menu-label menu-label--danger">注销账号</text>
        <text class="chevron">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const user = ref({ nickname: '', avatarUrl: '' })
const summary = ref({ totalCheckins: 0, streakDays: 0, totalItems: 0 })
const unreadCount = ref(0)
function go(url) { uni.navigateTo({ url }) }
onMounted(() => { /* TODO: 从云数据库加载用户信息与摘要数据 */ })
</script>

<style scoped>
.page { min-height: 100vh; background: #F8F9FB; padding: 24rpx; display: flex; flex-direction: column; gap: 20rpx; }
.profile-card {
  display: flex; align-items: center; gap: 24rpx;
  background: #FFFFFF; border-radius: 32rpx;
  padding: 32rpx 28rpx; border: 2rpx solid #F0F2F7;
}
.avatar-img { width: 100rpx; height: 100rpx; border-radius: 50%; }
.avatar-ph {
  width: 100rpx; height: 100rpx; border-radius: 50%;
  background: #EEF2FF; display: flex;
  align-items: center; justify-content: center; font-size: 48rpx;
}
.profile-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.profile-name { font-size: 36rpx; font-weight: 800; color: #1A2033; }
.stats-card {
  display: flex; align-items: center;
  background: #FFFFFF; border-radius: 32rpx;
  padding: 32rpx 28rpx; border: 2rpx solid #F0F2F7;
}
.stat-cell { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
.stat-val { font-size: 44rpx; font-weight: 800; color: #4F7CFF; }
.stat-divider { width: 2rpx; height: 60rpx; background: #E4E8F0; }
.menu-group {
  background: #FFFFFF; border-radius: 32rpx;
  padding: 0 24rpx; border: 2rpx solid #F0F2F7; overflow: hidden;
}
.menu-item { display: flex; align-items: center; padding: 28rpx 0; gap: 20rpx; }
.menu-icon {
  width: 64rpx; height: 64rpx; border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; flex-shrink: 0;
}
.menu-label { flex: 1; font-size: 28rpx; font-weight: 600; color: #1A2033; }
.menu-label--danger { color: #FF3B30; }
.unread-badge {
  background: #FF3B30; color: #FFFFFF;
  border-radius: 40rpx; padding: 2rpx 12rpx;
  font-size: 22rpx; font-weight: 700; flex-shrink: 0;
}
.chevron { font-size: 36rpx; color: #C8CFDE; }
</style>
