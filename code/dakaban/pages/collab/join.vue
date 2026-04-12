<template>
  <view class="page">
    <!-- S10b: 输入邀请码 -->
    <view class="card">
      <text class="title">输入邀请码</text>
      <text class="sub">输入亲友分享给你的6位邀请码</text>
      <input
        class="code-input"
        v-model="code"
        placeholder="请输入邀请码"
        maxlength="8"
      />
      <view v-if="roleInfo.shown" class="role-confirm">
        <text class="role-tip">对方为{{ roleInfo.senderRoleLabel }}，你将作为<text class="role-highlight">{{ roleInfo.myRoleLabel }}</text>加入</text>
        <text class="expire-tip">⏱ 邀请码剩余有效时间：{{ roleInfo.expireTime }}</text>
        <view class="actions">
          <view class="btn-reject" @tap="reject"><text>拒绝邀请</text></view>
          <view class="btn-confirm" @tap="confirm"><text>确认绑定</text></view>
        </view>
      </view>
      <view v-else class="query-btn" @tap="queryCode"><text>验证邀请码</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const code = ref('')
const roleInfo = ref({
  shown: false,
  senderRoleLabel: '',
  myRoleLabel: '',
  expireTime: ''
})

function queryCode() {
  if (!code.value.trim()) return uni.showToast({ title: '请输入邀请码', icon: 'none' })
  // TODO: 调用云函数验证邀请码，返回角色信息
  // 模拟验证成功
  roleInfo.value = {
    shown: true,
    senderRoleLabel: '被监督方',
    myRoleLabel: '监督方',
    expireTime: '23:12'
  }
}

function reject() {
  // TODO: 调用云函数记录拒绝，通知对方
  uni.showToast({ title: '已拒绝', icon: 'none' })
  setTimeout(() => {
    const pages = getCurrentPages()
    if (pages.length > 1) uni.navigateBack()
    else uni.reLaunch({ url: '/pages/checkin/index' })
  }, 1000)
}

function confirm() {
  // TODO: 调用云函数确认绑定，写入 bindings
  uni.showToast({ title: '绑定成功', icon: 'success' })
  setTimeout(() => {
    uni.redirectTo({ url: '/pages/collab/auth-config' })
  }, 1000)
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 40rpx 24rpx; }
.card { background: #fff; border-radius: 28rpx; padding: 40rpx 28rpx; box-shadow: 0 2rpx 20rpx rgba(0,0,0,.07); }
.title { font-size: 36rpx; font-weight: 800; color: #2D3748; display: block; margin-bottom: 10rpx; }
.sub { font-size: 26rpx; color: #9AA5BE; display: block; margin-bottom: 32rpx; }
.code-input {
  width: 100%;
  background: #F8F9FB;
  border: 2rpx solid #E4E8F0;
  border-radius: 16rpx;
  padding: 24rpx 20rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: #4F7CFF;
  letter-spacing: 8rpx;
  text-align: center;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}
.query-btn { background: #4F7CFF; color: #fff; text-align: center; padding: 28rpx; border-radius: 20rpx; font-size: 30rpx; font-weight: 700; }
.role-confirm { margin-top: 8rpx; }
.role-tip { font-size: 28rpx; color: #2D3748; display: block; margin-bottom: 10rpx; line-height: 1.6; }
.role-highlight { color: #4F7CFF; font-weight: 700; }
.expire-tip { font-size: 24rpx; color: #FF9500; display: block; margin-bottom: 28rpx; }
.actions { display: flex; gap: 16rpx; }
.btn-reject { flex: 1; text-align: center; padding: 24rpx; border-radius: 16rpx; background: #F0F2F7; color: #6B7A99; font-size: 28rpx; font-weight: 600; }
.btn-confirm { flex: 2; text-align: center; padding: 24rpx; border-radius: 16rpx; background: #4F7CFF; color: #fff; font-size: 28rpx; font-weight: 700; }
</style>
