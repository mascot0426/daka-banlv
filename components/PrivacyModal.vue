<template>
  <view v-if="visible" class="privacy-mask">
    <view class="app-icon">📅</view>
    <view class="app-title">日程打卡</view>
    <view class="app-subtitle">通用日程管理与亲友协同工具</view>

    <view class="privacy-card">
      <view class="privacy-title">打卡伴隐私保护指引</view>
      <view class="privacy-content">打卡伴非常重视您的隐私保护，严格遵守相关法律法规与微信平台规则。

我们将严格遵循最小必要原则，仅在您主动授权后，收集以下信息：
1. 您主动填写的微信昵称与头像：仅用于亲友协同场景的身份识别
2. 您主动上传的图片：仅存储于您的账号内
3. 您主动录入的打卡、记录内容：仅用于为您提供核心工具服务
4. 通过 wx.login 获取的 openid：仅作为您的账号唯一标识

您可以随时注销账号并彻底删除所有数据。
拒绝本指引后，您仍可使用基础打卡功能。</view>

      <view class="privacy-actions">
        <view class="privacy-btn privacy-btn-reject" @tap="handleReject">拒绝</view>
        <view class="privacy-btn privacy-btn-agree" @tap="handleAgree">同意并继续</view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['agree', 'reject'])

const handleAgree = () => {
  emit('agree')
}

const handleReject = () => {
  emit('reject')
}
</script>

<style scoped>
.privacy-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: linear-gradient(160deg, #1A2340 0%, #2A3F6F 100%);
  box-sizing: border-box;
}

.app-icon {
  font-size: 52px;
  margin-bottom: 16px;
}

.app-title {
  margin-bottom: 6px;
  font-size: 22px;
  font-weight: 800;
  color: #FFFFFF;
}

.app-subtitle {
  margin-bottom: 40px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.privacy-card {
  width: 100%;
  padding: 24px 20px;
  background: #FFFFFF;
  border-radius: 20px;
  box-sizing: border-box;
}

.privacy-title {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #1A2033;
}

.privacy-content {
  margin-bottom: 16px;
  font-size: 12px;
  line-height: 1.7;
  color: #4A5568;
  white-space: pre-line;
}

.privacy-actions {
  display: flex;
  gap: 10px;
}

.privacy-btn {
  flex: 1;
  padding: 11px 0;
  border-radius: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.privacy-btn-reject {
  background: #F0F2F7;
  color: #4A5568;
}

.privacy-btn-agree {
  background: #4F7CFF;
  color: #FFFFFF;
}
</style>
