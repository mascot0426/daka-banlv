<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="back-arrow">‹</text>
        <text class="back-text">返回</text>
      </view>
      <text class="nav-title">输入邀请码</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 输入邀请码 -->
    <view v-if="phase === 'input'" class="card">
      <text class="phase-title">收到邀请码？</text>
      <text class="phase-sub">输入亲友分享给你的6位邀请码，开始协同</text>

      <input
        class="code-input"
        v-model="code"
        placeholder="请输入6位邀请码"
        maxlength="6"
        @input="code = code.toUpperCase()"
      />

      <view
        class="verify-btn"
        :class="{ 'verify-btn--disabled': !code || code.length < 6 }"
        @tap="queryCode"
      >
        <text>验证邀请码</text>
      </view>
    </view>

    <!-- 确认邀请界面 -->
    <view v-if="phase === 'confirm'" class="card">

      <!-- 发起方头像区 -->
      <view class="inviter-section">
        <view class="inviter-avatar">
          <text class="inviter-avatar-text">{{ inviterLabel }}</text>
        </view>
        <text class="inviter-name">{{ inviterLabel }}</text>
        <text class="inviter-sub">邀请您加入协同</text>
      </view>

      <!-- 角色信息卡 -->
      <view class="role-card">
        <view class="role-row">
          <text class="role-key">对方角色</text>
          <text class="role-val role-val--blue">{{ senderRoleLabel }}</text>
        </view>
        <view class="role-row">
          <text class="role-key">您的角色</text>
          <text class="role-val role-val--green">{{ myRoleLabel }}</text>
        </view>
        <view class="role-row">
          <text class="role-key">邀请码有效期</text>
          <text class="role-val role-val--orange">{{ expireDisplay }}</text>
        </view>
      </view>

      <!-- 授权说明 -->
      <view class="info-card">
        <text class="info-text">确认后您将成为{{ myRoleLabel }}，对方可在您授权后查看您的打卡数据。默认不开放任何数据，需您手动配置授权范围。随时可解除绑定，对方立即失去查看权限。</text>
      </view>

      <!-- 按钮组 -->
      <view class="actions">
        <view class="btn-reject" @tap="reject">
          <text>拒绝邀请</text>
        </view>
        <view class="btn-confirm" @tap="confirm">
          <text>确认绑定 →</text>
        </view>
      </view>

      <!-- 警告 -->
      <view class="warn-card">
        <text class="warn-icon">⚠️</text>
        <text class="warn-text">拒绝后对方将收到通知，邀请码仍有效，其他人仍可使用该邀请码发起绑定。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const code = ref('')
const phase = ref('input')
const bindingRecord = ref(null)

// 对方昵称标签（取 openid 前4位作匿名标记）
const inviterLabel = computed(() => {
  const rec = bindingRecord.value
  if (!rec) return '对方'
  const openid = rec.supervisorOpenid || rec.superviseeOpenid || ''
  return '用户' + openid.slice(-4).toUpperCase()
})

// 对方角色标签（邀请码中携带的角色方 = 对方角色）
const senderRoleLabel = computed(() => {
  const rec = bindingRecord.value
  if (!rec) return '--'
  return rec.supervisorOpenid ? '监督方' : '被监督方'
})

// 我的角色（与对方相反）
const myRoleLabel = computed(() => {
  const rec = bindingRecord.value
  if (!rec) return '--'
  return rec.supervisorOpenid ? '被监督方' : '监督方'
})

// 剩余有效期展示
const expireDisplay = computed(() => {
  const rec = bindingRecord.value
  if (!rec || !rec.inviteExpireAt) return '--'
  const remaining = Math.max(0, rec.inviteExpireAt - Date.now())
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `剩余 ${hours}小时${minutes}分`
  return `剩余 ${minutes}分钟`
})

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/collab/index' })
}

// 查询邀请码
async function queryCode() {
  if (!code.value || code.value.length < 6) {
    uni.showToast({ title: '请输入完整的6位邀请码', icon: 'none' })
    return
  }

  uni.showLoading({ title: '验证中...' })

  try {
    const res = await uni.cloud.callFunction({
      name: 'confirmBinding',
      data: { inviteCode: code.value, action: 'query' }
    })

    uni.hideLoading()

    if (!res.result) {
      uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
      return
    }

    if (res.result.success && res.result.record) {
      // action: 'query' 非标准动作，云函数会返回 CODE_NOT_FOUND
      // 改用数据库直接查询
      await queryFromDb()
    } else {
      handleError(res.result.errCode)
    }
  } catch (e) {
    uni.hideLoading()
    console.error('queryCode error:', e)
    uni.showToast({ title: '验证失败，请检查邀请码是否正确', icon: 'none' })
  }
}

async function queryFromDb() {
  uni.showLoading({ title: '加载中...' })

  try {
    const db = wx.cloud.database()
    const res = await db.collection('bindings')
      .where({
        inviteCode: code.value,
        status: 'pending'
      })
      .limit(1)
      .get({ fetchOptions: { fromCache: false } })

    uni.hideLoading()

    if (res.data && res.data.length > 0) {
      const record = res.data[0]
      // 检查是否过期
      if (record.inviteExpireAt <= Date.now()) {
        uni.showToast({ title: '邀请码已过期，请让对方重新生成', icon: 'none' })
        return
      }
      bindingRecord.value = record
      phase.value = 'confirm'
    } else {
      uni.showToast({ title: '邀请码无效或已失效', icon: 'none' })
    }
  } catch (e) {
    uni.hideLoading()
    console.error('queryFromDb error:', e)
    uni.showToast({ title: '查询失败，请稍后重试', icon: 'none' })
  }
}

function handleError(errCode) {
  const msg = {
    CODE_NOT_FOUND: '邀请码不存在或已失效',
    CODE_EXPIRED: '邀请码已过期，请让对方重新生成',
    INVALID_CODE: '邀请码格式不正确',
    ALREADY_BINDING: '不能接受自己发出的邀请',
    NO_OPENID: '无法获取用户身份'
  }
  uni.showToast({ title: msg[errCode] || '验证失败', icon: 'none' })
}

async function confirm() {
  uni.showLoading({ title: '绑定中...' })

  try {
    const res = await uni.cloud.callFunction({
      name: 'confirmBinding',
      data: { inviteCode: code.value, action: 'confirm' }
    })

    uni.hideLoading()

    if (!res.result) {
      uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
      return
    }

    if (res.result.success) {
      uni.showToast({ title: '绑定成功！', icon: 'success' })
      setTimeout(() => {
        uni.redirectTo({ url: `/pages/collab/auth-config?bindingId=${res.result.bindingId}` })
      }, 1200)
    } else {
      handleError(res.result.errCode)
    }
  } catch (e) {
    uni.hideLoading()
    console.error('confirm error:', e)
    uni.showToast({ title: '绑定失败，请稍后重试', icon: 'none' })
  }
}

async function reject() {
  uni.showLoading({ title: '请稍候...' })

  try {
    const res = await uni.cloud.callFunction({
      name: 'confirmBinding',
      data: { inviteCode: code.value, action: 'reject' }
    })

    uni.hideLoading()

    if (!res.result) {
      uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
      return
    }

    if (res.result.success) {
      uni.showToast({ title: '已拒绝', icon: 'none' })
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) uni.navigateBack()
        else uni.reLaunch({ url: '/pages/collab/index' })
      }, 1000)
    } else {
      handleError(res.result.errCode)
    }
  } catch (e) {
    uni.hideLoading()
    console.error('reject error:', e)
    uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' })
  }
}
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
.card {
  margin: 24rpx;
  background: #fff;
  border-radius: 28rpx;
  padding: 40rpx 28rpx;
  box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.06);
}

/* Phase: input */
.phase-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1A2033;
  display: block;
  margin-bottom: 8rpx;
}
.phase-sub {
  font-size: 24rpx;
  color: #9AA5BE;
  display: block;
  margin-bottom: 32rpx;
  line-height: 1.5;
}

.code-input {
  width: 100%;
  background: #F8F9FB;
  border: 4rpx solid #E4E8F0;
  border-radius: 16rpx;
  padding: 28rpx 20rpx;
  font-size: 36rpx;
  font-weight: 800;
  color: #4F7CFF;
  letter-spacing: 8rpx;
  text-align: center;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.verify-btn {
  background: #4F7CFF;
  color: #fff;
  text-align: center;
  padding: 28rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 700;
}
.verify-btn--disabled {
  background: #C8CFDE;
  color: #fff;
}

/* Phase: confirm */
/* 发起方头像区 */
.inviter-section {
  text-align: center;
  padding: 24rpx 0 28rpx;
}
.inviter-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #4F7CFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
}
.inviter-avatar-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
}
.inviter-name {
  font-size: 36rpx;
  font-weight: 800;
  color: #1A2033;
  display: block;
  margin-bottom: 6rpx;
}
.inviter-sub {
  font-size: 24rpx;
  color: #9AA5BE;
}

/* 角色信息卡 */
.role-card {
  background: #EEF2FF;
  border: 2rpx solid #4F7CFF;
  border-radius: 28rpx;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.role-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.role-key {
  font-size: 26rpx;
  color: #4A5568;
}

.role-val {
  padding: 4rpx 18rpx;
  border-radius: 40rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.role-val--blue {
  background: #EEF2FF;
  color: #4F7CFF;
}

.role-val--green {
  background: #EDFAF2;
  color: #34C759;
}

.role-val--orange {
  font-size: 22rpx;
  color: #FF9500;
  font-weight: 700;
  padding: 0;
  border-radius: 0;
}

/* 授权说明 */
.info-card {
  background: #F8F9FB;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.info-text {
  font-size: 24rpx;
  color: #4A5568;
  line-height: 1.7;
}

/* 按钮组 */
.actions {
  display: flex;
  flex-direction: row;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.btn-reject {
  flex: 1;
  background: #F0F2F7;
  color: #4A5568;
  text-align: center;
  padding: 28rpx 0;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.btn-confirm {
  flex: 2;
  background: #4F7CFF;
  color: #fff;
  text-align: center;
  padding: 28rpx 0;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 700;
}

/* 警告卡 */
.warn-card {
  background: #FFF5E6;
  border: 2rpx solid #FF9500;
  border-radius: 28rpx;
  padding: 28rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12rpx;
}

.warn-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}

.warn-text {
  font-size: 24rpx;
  color: #2D3748;
  line-height: 1.6;
  flex: 1;
}
</style>
