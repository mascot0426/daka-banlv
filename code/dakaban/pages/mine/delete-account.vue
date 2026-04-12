<template>
  <view class="page">
    <!-- S19: 账号注销 -->
    <view class="warn-card">
      <text class="warn-icon">⚠️</text>
      <text class="warn-title">注销前请确认</text>
      <view class="warn-list">
        <view class="warn-item"><text class="bullet">•</text><text>您的所有打卡记录将被彻底删除，不可恢复</text></view>
        <view class="warn-item"><text class="bullet">•</text><text>所有协同绑定关系将立即解除</text></view>
        <view class="warn-item"><text class="bullet">•</text><text>绑定的亲友将实时收到解绑通知</text></view>
        <view class="warn-item"><text class="bullet">•</text><text>心愿单、时间线等所有数据一并删除</text></view>
      </view>
    </view>

    <view class="cancel-btn" @tap="goBack"><text>取消，我再想想</text></view>
    <view class="delete-btn" @tap="confirmDelete"><text>确认注销账号</text></view>
  </view>
</template>

<script setup>
function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/checkin/index' })
  }
}

function confirmDelete() {
  uni.showModal({
    title: '最后确认',
    content: '注销后您的所有数据将被彻底删除，且不可恢复。确认注销？',
    confirmText: '确认注销账号',
    confirmColor: '#FF3B30',
    cancelText: '取消',
    success(res) {
      if (res.confirm) {
        // TODO: 调用云函数删除所有用户数据、解除绑定、清除登录态
        uni.showToast({ title: '账号已注销', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/checkin/index' })
        }, 1500)
      }
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 40rpx 24rpx; display: flex; flex-direction: column; gap: 24rpx; }
.warn-card { background: #FFF0EF; border: 1rpx solid #FFCDC9; border-radius: 24rpx; padding: 40rpx 32rpx; }
.warn-icon { font-size: 56rpx; display: block; text-align: center; margin-bottom: 20rpx; }
.warn-title { font-size: 32rpx; font-weight: 800; color: #FF3B30; display: block; text-align: center; margin-bottom: 28rpx; }
.warn-list { display: flex; flex-direction: column; gap: 16rpx; }
.warn-item { display: flex; align-items: flex-start; gap: 12rpx; }
.bullet { font-size: 30rpx; color: #FF3B30; line-height: 1.5; flex-shrink: 0; }
.warn-item text:last-child { font-size: 27rpx; color: #4A5568; line-height: 1.6; }
.cancel-btn { background: #fff; border: 2rpx solid #C8CFDE; color: #6B7A99; text-align: center; padding: 28rpx; border-radius: 20rpx; font-size: 30rpx; font-weight: 600; }
.delete-btn { background: #FF3B30; color: #fff; text-align: center; padding: 28rpx; border-radius: 20rpx; font-size: 30rpx; font-weight: 700; }
</style>
