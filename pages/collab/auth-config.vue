<template>
  <view class="page">
    <!-- S10c: 授权配置 -->
    <view class="tip-card">
      <text class="tip-icon">🔒</text>
      <text class="tip-text">默认全部关闭，请按需开放给对方查看的数据范围</text>
    </view>

    <view class="module-list">
      <view v-for="mod in modules" :key="mod.key" class="module-item">
        <view class="module-left">
          <text class="mod-icon">{{ mod.icon }}</text>
          <view class="mod-info">
            <text class="mod-name">{{ mod.label }}</text>
            <text class="mod-desc">{{ mod.desc }}</text>
          </view>
        </view>
        <view class="switch" :class="{ 'switch--on': mod.enabled }" @tap="toggleModule(mod)" />
      </view>
    </view>

    <view class="done-btn" @tap="saveConfig"><text>完成配置</text></view>
    <text class="skip-tip">可随时在「我的 → 隐私设置」中修改</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const modules = ref([
  { key: 'checkin', icon: '✅', label: '打卡事项', desc: '对方可查看你的打卡进度', enabled: false },
  { key: 'rate', icon: '📊', label: '打卡完成率', desc: '显示整体完成率统计', enabled: false },
  { key: 'overdue', icon: '⏰', label: '逾期记录', desc: '显示逾期情况分布', enabled: false },
  { key: 'data', icon: '📈', label: '自定义数据记录', desc: '折线图数据对方可见', enabled: false },
  { key: 'timeline', icon: '🗓️', label: '个人时间线', desc: '成长轨迹对方可见', enabled: false },
  { key: 'wish', icon: '✨', label: '心愿单（仅名称）', desc: '心愿名称对方可见，说明与图片不开放', enabled: false }
])

function toggleModule(mod) {
  mod.enabled = !mod.enabled
}

function saveConfig() {
  const enabled = modules.value.filter(m => m.enabled).map(m => m.key)
  // TODO: 调用云函数保存至 privacy_settings 集合
  uni.showToast({ title: '配置已保存', icon: 'success' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/collab/index' })
  }, 1000)
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; }
.tip-card { display: flex; align-items: flex-start; gap: 16rpx; background: #EEF2FF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 24rpx; }
.tip-icon { font-size: 36rpx; flex-shrink: 0; }
.tip-text { font-size: 26rpx; color: #4F7CFF; line-height: 1.6; }
.module-list { background: #fff; border-radius: 24rpx; padding: 0 20rpx; margin-bottom: 32rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); }
.module-item { display: flex; align-items: center; justify-content: space-between; padding: 28rpx 8rpx; border-bottom: 1rpx solid #F0F2F7; }
.module-item:last-child { border-bottom: none; }
.module-left { display: flex; align-items: center; gap: 20rpx; flex: 1; }
.mod-icon { font-size: 36rpx; flex-shrink: 0; }
.mod-info { flex: 1; }
.mod-name { font-size: 28rpx; font-weight: 700; color: #2D3748; display: block; }
.mod-desc { font-size: 23rpx; color: #9AA5BE; display: block; margin-top: 4rpx; }
.switch { width: 92rpx; height: 56rpx; border-radius: 28rpx; background: #C8CFDE; position: relative; flex-shrink: 0; transition: background 0.2s; }
.switch::after { content: ''; position: absolute; width: 48rpx; height: 48rpx; background: #fff; border-radius: 50%; top: 4rpx; left: 4rpx; box-shadow: 0 2rpx 6rpx rgba(0,0,0,.2); transition: left 0.2s; }
.switch--on { background: #4F7CFF; }
.switch--on::after { left: 40rpx; }
.done-btn { background: #4F7CFF; color: #fff; text-align: center; padding: 30rpx; border-radius: 20rpx; font-size: 30rpx; font-weight: 700; margin-bottom: 20rpx; }
.skip-tip { display: block; text-align: center; font-size: 24rpx; color: #9AA5BE; }
</style>
