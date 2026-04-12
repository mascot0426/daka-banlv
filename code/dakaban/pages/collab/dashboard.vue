<template>
  <view class="page">
    <!-- S9: 亲友打卡看板 -->
    <view class="member-header">
      <view class="member-avatar">
        <image v-if="member.avatarUrl" :src="member.avatarUrl" class="avatar-img" />
        <view v-else class="avatar-placeholder"><text>{{ (member.nickname||'友')[0] }}</text></view>
      </view>
      <view class="member-info">
        <text class="member-name">{{ member.nickname || '亲友' }}</text>
        <text class="member-role">{{ member.myRole === 'supervisor' ? '我是监督方' : '我是被监督方' }}</text>
      </view>
      <view class="refresh-btn" @tap="loadData"><text>↻ 刷新</text></view>
    </view>

    <view class="stats-card">
      <view class="stat-cell">
        <text class="stat-val blue">{{ board.todayRate ?? '--' }}%</text>
        <text class="stat-lbl">今日完成率</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-cell">
        <text class="stat-val green">{{ board.monthRate ?? '--' }}%</text>
        <text class="stat-lbl">本月完成率</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-cell">
        <text class="stat-val orange">{{ board.overdueCount ?? '--' }}</text>
        <text class="stat-lbl">逾期次数</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">打卡事项进度</text>
      <view v-if="!board.items || board.items.length === 0" class="no-auth">
        <text>用户未开放此项数据</text>
      </view>
      <view v-for="it in board.items" :key="it.itemId" class="item-row">
        <text class="item-name">{{ it.name }}</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: it.rate + '%' }" />
        </view>
        <text class="item-rate">{{ it.rate }}%</text>
      </view>
    </view>

    <view class="care-section" v-if="member.myRole === 'supervisor'">
      <text class="section-title">发送关怀提示</text>
      <textarea class="care-input" v-model="careMsg" placeholder="输入一句关怀的话..." maxlength="100" />
      <view class="care-btn" :class="{ 'care-btn--disabled': careDisabled }" @tap="sendCare">
        <text>{{ careDisabled ? '今日已发送' : '发送关怀' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const member = ref({ nickname: '', avatarUrl: '', myRole: 'supervisor' })
const board = ref({ todayRate: null, monthRate: null, overdueCount: null, items: [] })
const careMsg = ref('')
const careDisabled = ref(false)

function loadData() {
  // TODO: 从云函数拉取亲友看板数据（按授权范围）
  uni.showToast({ title: '刷新中...', icon: 'none', duration: 800 })
}

function sendCare() {
  if (careDisabled.value) return
  if (!careMsg.value.trim()) return uni.showToast({ title: '请输入关怀内容', icon: 'none' })
  // TODO: 调用云函数发送关怀，写入 notifications 集合
  careDisabled.value = true
  uni.showToast({ title: '关怀已发送', icon: 'success' })
  careMsg.value = ''
}

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const bindingId = page.options?.bindingId
  if (bindingId) loadData()
})
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; display: flex; flex-direction: column; gap: 20rpx; }
.member-header { display: flex; align-items: center; background: #fff; border-radius: 24rpx; padding: 24rpx; gap: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); }
.avatar-img { width: 80rpx; height: 80rpx; border-radius: 50%; }
.avatar-placeholder { width: 80rpx; height: 80rpx; border-radius: 50%; background: #EEF2FF; display: flex; align-items: center; justify-content: center; font-size: 32rpx; color: #4F7CFF; font-weight: 700; }
.member-info { flex: 1; }
.member-name { font-size: 30rpx; font-weight: 700; color: #2D3748; display: block; }
.member-role { font-size: 24rpx; color: #9AA5BE; display: block; margin-top: 4rpx; }
.refresh-btn { background: #F0F2F7; padding: 12rpx 24rpx; border-radius: 16rpx; font-size: 24rpx; color: #6B7A99; }
.stats-card { display: flex; align-items: center; background: #fff; border-radius: 24rpx; padding: 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); }
.stat-cell { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
.stat-val { font-size: 40rpx; font-weight: 800; }
.stat-val.blue { color: #4F7CFF; } .stat-val.green { color: #34C759; } .stat-val.orange { color: #FF9500; }
.stat-lbl { font-size: 22rpx; color: #9AA5BE; }
.stat-divider { width: 1rpx; height: 60rpx; background: #E4E8F0; }
.section { background: #fff; border-radius: 24rpx; padding: 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); }
.section-title { font-size: 26rpx; font-weight: 700; color: #9AA5BE; display: block; margin-bottom: 16rpx; letter-spacing: 2rpx; }
.no-auth { padding: 20rpx 0; font-size: 26rpx; color: #C8CFDE; text-align: center; }
.item-row { display: flex; align-items: center; gap: 16rpx; padding: 14rpx 0; border-bottom: 1rpx solid #F0F2F7; }
.item-row:last-child { border-bottom: none; }
.item-name { font-size: 26rpx; color: #4A5568; width: 200rpx; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.progress-bar { flex: 1; height: 12rpx; background: #F0F2F7; border-radius: 6rpx; overflow: hidden; }
.progress-fill { height: 100%; background: #4F7CFF; border-radius: 6rpx; transition: width 0.3s; }
.item-rate { font-size: 24rpx; color: #4F7CFF; font-weight: 700; width: 70rpx; text-align: right; flex-shrink: 0; }
.care-section { background: #fff; border-radius: 24rpx; padding: 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); }
.care-input { width: 100%; background: #F8F9FB; border: 2rpx solid #E4E8F0; border-radius: 12rpx; padding: 18rpx; font-size: 27rpx; color: #2D3748; height: 120rpx; box-sizing: border-box; display: block; margin-bottom: 16rpx; }
.care-btn { background: #4F7CFF; color: #fff; text-align: center; padding: 24rpx; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; }
.care-btn--disabled { background: #C8CFDE; }
</style>
