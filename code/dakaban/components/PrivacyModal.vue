<template>
  <view v-if="visible" class="privacy-mask">
    <view class="hero">
      <text class="app-icon">📅</text>
      <text class="app-title">日程打卡</text>
      <text class="app-subtitle">通用日程管理与亲友协同工具</text>
    </view>

    <view class="privacy-card">
      <text class="privacy-title">隐私保护指引</text>
      <text class="privacy-content">本小程序严格遵守相关法律法规。我们将在您主动授权后，仅收集以下信息：

1. 微信昵称与头像：用于亲友协同身份识别
2. 主动上传的图片：仅存于您的账号内
3. 打卡记录内容：用于提供核心工具服务
4. openid：作为账号唯一标识

拒绝后仍可使用基础打卡记录功能。</text>

      <view class="privacy-actions">
        <view class="privacy-btn privacy-btn-reject" @tap="handleReject"><text>拒绝</text></view>
        <view class="privacy-btn privacy-btn-agree" @tap="handleAgree"><text>同意并继续</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['agree', 'reject'])
const handleAgree = () => emit('agree')
const handleReject = () => emit('reject')
</script>

<style scoped lang="scss">
@import "@/uni.scss";

.privacy-mask {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48rpx;
  background: linear-gradient(160deg, #1A2340 0%, #2A3F6F 100%);
  box-sizing: border-box;
}
.hero { align-items:center; display:flex; flex-direction:column; margin-bottom: 28rpx; }
.app-icon { font-size: 88rpx; margin-bottom: 12rpx; }
.app-title { font-size: 42rpx; font-weight: 800; color: #fff; margin-bottom: 6rpx; }
.app-subtitle { font-size: 24rpx; color: rgba(255,255,255,.6); }

.privacy-card {
  width: 100%;
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 12rpx 42rpx rgba(0,0,0,.16);
}
.privacy-title { display:block; margin-bottom: 12rpx; font-size: 30rpx; font-weight: 800; color: $dk-text-primary; }
.privacy-content {
  display:block; margin-bottom: 18rpx;
  font-size: 24rpx; line-height: 1.7; color: #4A5568;
  white-space: pre-line;
}
.privacy-actions { display:flex; gap: 12rpx; }
.privacy-btn {
  flex: 1; text-align: center; padding: 18rpx 0;
  border-radius: 16rpx; font-size: 26rpx; font-weight: 700;
}
.privacy-btn-reject { background: $dk-divider; color: #4A5568; }
.privacy-btn-agree { background: $dk-brand; color: #fff; }
</style>
