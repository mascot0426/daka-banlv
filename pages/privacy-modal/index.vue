<template>
  <PrivacyModal
    :visible="true"
    @agree="handleAgree"
    @reject="handleReject"
  />
</template>

<script setup>
import PrivacyModal from '@/components/PrivacyModal.vue'

const backToHome = () => {
  uni.switchTab({
    url: '/pages/checkin/index'
  })
}

const handleAgree = async () => {
  try {
    const loginRes = await wx.cloud.callFunction({
      name: 'login',
      data: {
        code: ''
      }
    })

    console.log('[login-call-result]', loginRes)

    const result = loginRes.result || {}
    if (!result.success || !result.openid) {
      uni.showToast({
        title: result.errMsg || '登录失败，请重试',
        icon: 'none'
      })
      return
    }

    wx.setStorageSync('openid', result.openid)
    wx.setStorageSync('privacyAgreed', true)
    backToHome()
  } catch (err) {
    console.error('[login-call-error]', err)
    uni.showToast({
      title: err.errMsg || err.message || '网络异常，请稍后重试',
      icon: 'none'
    })
  }
}

const handleReject = () => {
  wx.setStorageSync('privacyAgreed', false)
  uni.showToast({
    title: '已拒绝隐私授权，可使用基础打卡功能',
    icon: 'none'
  })
  backToHome()
}
</script>

<style scoped>
/* 页面由 PrivacyModal 全屏覆盖，无额外样式 */
</style>
