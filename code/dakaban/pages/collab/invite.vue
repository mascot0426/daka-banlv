<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="back-arrow">‹</text>
        <text class="back-text">返回</text>
      </view>
      <text class="nav-title">邀请亲友</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- Step 1：角色选择 -->
    <view v-if="step === 1" class="step-card">
      <text class="step-title">Step 1 · 选择您的角色</text>
      <text class="step-sub">角色一经选择将携带于邀请码中，对方将自动对应相反角色</text>

      <view class="role-options">
        <!-- 被监督方：选中态蓝色 -->
        <view
          class="role-card"
          :class="{ 'role-card--active': role === 'supervisee' }"
          @tap="role = 'supervisee'"
        >
          <text class="role-icon">🙋</text>
          <text class="role-name">我是被监督方</text>
          <text class="role-desc">对方将作为监督方</text>
        </view>
        <!-- 监督方：未选态灰色 -->
        <view
          class="role-card"
          :class="{ 'role-card--active': role === 'supervisor' }"
          @tap="role = 'supervisor'"
        >
          <text class="role-icon">👀</text>
          <text class="role-name">我是监督方</text>
          <text class="role-desc">对方将作为被监督方</text>
        </view>
      </view>

      <view class="generate-btn" @tap="generateCode">
        <text>生成邀请码</text>
      </view>
    </view>

    <!-- Step 2：邀请码展示 -->
    <view v-if="step === 2" class="step-card">
      <text class="step-title">Step 2 · 分享邀请码</text>

      <!-- 邀请码黑底卡片 -->
      <view class="code-card">
        <text class="code-label">您的专属邀请码（已携带角色：{{ roleLabel }}）</text>
        <text class="code-text">{{ formattedCode }}</text>
        <view class="code-actions">
          <view class="code-btn" @tap="copyCode">
            <text>复制邀请码</text>
          </view>
          <view class="code-btn code-btn--share" @tap="shareCode">
            <text>分享给亲友</text>
          </view>
        </view>
      </view>

      <!-- 有效期警告卡片 -->
      <view class="expire-card">
        <text class="expire-icon">⏱</text>
        <text class="expire-text">邀请码有效期 <text class="expire-highlight">{{ expireDisplay }}</text>，到期自动失效；过期后系统提示「邀请码已过期，请重新生成」</text>
      </view>

      <!-- 重新生成 -->
      <view class="regen-btn" @tap="step = 1; role = 'supervisee'">
        <text>重新生成</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const step = ref(1)
const role = ref('supervisee')
const inviteCode = ref('')
const expireAt = ref(0)
let countdownTimer = null

// 角色标签
const roleLabel = computed(() => role.value === 'supervisee' ? '被监督方' : '监督方')

// 格式化邀请码（每3位空一格）
const formattedCode = computed(() => {
  const c = inviteCode.value
  if (!c) return ''
  return c.length === 6 ? c.slice(0, 3) + ' ' + c.slice(3) : c
})

// 剩余时间展示
const expireDisplay = computed(() => {
  if (!expireAt.value) return '--'
  const remaining = Math.max(0, expireAt.value - Date.now())
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}小时${minutes}分`
  return `${minutes}分钟`
})

// 刷新倒计时文字（每60秒更新一次）
function startCountdown() {
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    // setInterval 里直接读 expireAt.value，依赖组件响应式
    if (expireAt.value && expireAt.value <= Date.now()) {
      clearInterval(countdownTimer)
      uni.showToast({ title: '邀请码已过期，请重新生成', icon: 'none' })
      step.value = 1
    }
  }, 60000)
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/collab/index' })
  }
}

async function generateCode() {
  if (!role.value) {
    uni.showToast({ title: '请先选择角色', icon: 'none' })
    return
  }
  uni.showLoading({ title: '生成中...' })

  try {
    const res = await uni.cloud.callFunction({
      name: 'generateInviteCode',
      data: { role: role.value }
    })

    uni.hideLoading()

    if (!res.result) {
      uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
      return
    }

    if (res.result.success) {
      inviteCode.value = res.result.inviteCode
      expireAt.value = res.result.expireAt
      step.value = 2
      startCountdown()
    } else {
      const msg = {
        BINDING_FULL: '您已绑定5位亲友，请先解绑后再试',
        INVALID_ROLE: '角色参数不正确',
        CODE_GEN_FAILED: '邀请码生成失败，请稍后重试',
        NO_OPENID: '无法获取用户身份，请重新启动小程序'
      }
      uni.showToast({ title: msg[res.result.errCode] || res.result.errMsg, icon: 'none' })
    }
  } catch (e) {
    uni.hideLoading()
    console.error('generateInviteCode error:', e)
    uni.showToast({ title: '调用失败，请检查云函数是否已部署', icon: 'none' })
  }
}

function copyCode() {
  if (!inviteCode.value) return
  uni.setClipboardData({
    data: inviteCode.value,
    success() { uni.showToast({ title: '已复制到剪贴板', icon: 'success' }) }
  })
}

function shareCode() {
  uni.showToast({ title: '请复制邀请码后手动发送给对方', icon: 'none' })
}

onUnmounted(() => {
  clearInterval(countdownTimer)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F6FA;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  padding-top: calc(24rpx + env(safe-area-inset-top));
  background: #fff;
  border-bottom: 1rpx solid #E4E8F0;
}
.nav-back {
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.back-arrow {
  font-size: 40rpx;
  color: #4F7CFF;
  line-height: 1;
}
.back-text {
  font-size: 28rpx;
  color: #4F7CFF;
}
.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A2033;
}
.nav-placeholder {
  width: 80rpx;
}

/* 卡片容器 */
.step-card {
  margin: 24rpx;
  background: #fff;
  border-radius: 28rpx;
  padding: 40rpx 28rpx;
  box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.06);
}

.step-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1A2033;
  display: block;
  margin-bottom: 8rpx;
}

.step-sub {
  font-size: 24rpx;
  color: #9AA5BE;
  display: block;
  margin-bottom: 28rpx;
  line-height: 1.5;
}

/* 角色选择 */
.role-options {
  display: flex;
  flex-direction: row;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.role-card {
  flex: 1;
  border: 4rpx solid #E4E8F0;
  border-radius: 28rpx;
  padding: 28rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  background: #F8F9FB;
}

.role-card--active {
  border-color: #4F7CFF;
  background: #EEF2FF;
}

.role-icon {
  font-size: 48rpx;
  margin-bottom: 4rpx;
}

.role-name {
  font-size: 26rpx;
  font-weight: 700;
  color: #1A2033;
}

.role-desc {
  font-size: 22rpx;
  color: #6B7A99;
}

.role-card--active .role-name {
  color: #4F7CFF;
}

/* 生成按钮 */
.generate-btn {
  background: #4F7CFF;
  color: #fff;
  text-align: center;
  padding: 28rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 700;
}

/* 邀请码黑底卡片 */
.code-card {
  background: #1A2033;
  border-radius: 32rpx;
  padding: 40rpx 32rpx;
  text-align: center;
  margin-bottom: 20rpx;
}

.code-label {
  font-size: 22rpx;
  color: #9AA5BE;
  display: block;
  margin-bottom: 16rpx;
}

.code-text {
  font-size: 72rpx;
  font-weight: 900;
  color: #fff;
  letter-spacing: 16rpx;
  display: block;
  margin-bottom: 32rpx;
  word-break: break-all;
}

.code-actions {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  justify-content: center;
}

.code-btn {
  background: #EEF2FF;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #4F7CFF;
}

.code-btn--share {
  background: #4F7CFF;
  color: #fff;
}

/* 有效期警告 */
.expire-card {
  background: #FFF5E6;
  border: 2rpx solid #FF9500;
  border-radius: 28rpx;
  padding: 28rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.expire-icon {
  font-size: 36rpx;
  flex-shrink: 0;
}

.expire-text {
  font-size: 24rpx;
  color: #2D3748;
  line-height: 1.6;
  flex: 1;
}

.expire-highlight {
  color: #FF9500;
  font-weight: 700;
}

/* 重新生成 */
.regen-btn {
  background: #F0F2F7;
  color: #6B7A99;
  text-align: center;
  padding: 24rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
