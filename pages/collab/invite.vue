<template>
  <view class="page">
    <!-- S10: 邀请码生成 -->
    <view v-if="step === 1" class="step-card">
      <text class="step-title">选择你的角色</text>
      <text class="step-sub">在这段协同关系中，你是？</text>
      <view class="role-options">
        <view class="role-card" :class="{ 'role-card--active': role === 'supervisee' }" @tap="role = 'supervisee'">
          <text class="role-icon">🏃</text>
          <text class="role-name">我是被监督方</text>
          <text class="role-desc">对方将看到我的打卡进度</text>
        </view>
        <view class="role-card" :class="{ 'role-card--active': role === 'supervisor' }" @tap="role = 'supervisor'">
          <text class="role-icon">👀</text>
          <text class="role-name">我是监督方</text>
          <text class="role-desc">我将看到对方的打卡进度</text>
        </view>
      </view>
      <view class="next-btn" @tap="generateCode"><text>生成邀请码</text></view>
    </view>

    <view v-if="step === 2" class="step-card">
      <text class="step-title">邀请码已生成</text>
      <text class="step-sub">将邀请码分享给亲友，有效期24小时</text>
      <view class="code-box">
        <text class="code-text">{{ inviteCode }}</text>
      </view>
      <view class="expire-tip"><text>⏱ 剩余有效时间：{{ expireTime }}</text></view>
      <view class="copy-btn" @tap="copyCode"><text>复制邀请码</text></view>
      <view class="regen-btn" @tap="step = 1"><text>重新生成</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const step = ref(1)
const role = ref('supervisee')
const inviteCode = ref('')
const expireTime = ref('23:59')

function generateCode() {
  if (!role.value) return uni.showToast({ title: '请选择角色', icon: 'none' })
  // TODO: 调用云函数生成邀请码，写入 bindings 集合
  // 生成6位随机码作为占位
  inviteCode.value = Math.random().toString(36).substring(2, 8).toUpperCase()
  step.value = 2
}

function copyCode() {
  uni.setClipboardData({
    data: inviteCode.value,
    success() { uni.showToast({ title: '已复制', icon: 'success' }) }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; display: flex; align-items: flex-start; justify-content: center; padding: 40rpx 24rpx; }
.step-card { width: 100%; background: #fff; border-radius: 28rpx; padding: 40rpx 28rpx; box-shadow: 0 2rpx 20rpx rgba(0,0,0,.07); }
.step-title { font-size: 36rpx; font-weight: 800; color: #2D3748; display: block; margin-bottom: 10rpx; }
.step-sub { font-size: 26rpx; color: #9AA5BE; display: block; margin-bottom: 36rpx; }
.role-options { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 32rpx; }
.role-card { border: 2rpx solid #E4E8F0; border-radius: 20rpx; padding: 28rpx; display: flex; flex-direction: column; gap: 8rpx; }
.role-card--active { border-color: #4F7CFF; background: #EEF2FF; }
.role-icon { font-size: 40rpx; }
.role-name { font-size: 30rpx; font-weight: 700; color: #2D3748; }
.role-desc { font-size: 24rpx; color: #9AA5BE; }
.next-btn { background: #4F7CFF; color: #fff; text-align: center; padding: 28rpx; border-radius: 20rpx; font-size: 30rpx; font-weight: 700; }
.code-box { background: #F8F9FB; border: 2rpx dashed #C8CFDE; border-radius: 20rpx; padding: 40rpx; text-align: center; margin-bottom: 16rpx; }
.code-text { font-size: 56rpx; font-weight: 900; color: #4F7CFF; letter-spacing: 12rpx; }
.expire-tip { text-align: center; font-size: 24rpx; color: #FF9500; margin-bottom: 28rpx; }
.copy-btn { background: #4F7CFF; color: #fff; text-align: center; padding: 28rpx; border-radius: 20rpx; font-size: 30rpx; font-weight: 700; margin-bottom: 16rpx; }
.regen-btn { background: #F0F2F7; color: #6B7A99; text-align: center; padding: 24rpx; border-radius: 20rpx; font-size: 28rpx; font-weight: 600; }
</style>
