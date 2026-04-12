<template>
  <view class="page">
    <!-- S15: 隐私设置 -->
    <scroll-view class="member-bar" scroll-x="true">
      <view class="member-list">
        <view
          v-for="b in bindings" :key="b._id"
          class="member-item"
          :class="{ 'member-item--active': selectedId === b._id }"
          @tap="selectMember(b)"
        >
          <view class="m-avatar">
            <image v-if="b.avatarUrl" :src="b.avatarUrl" class="avatar-img" />
            <view v-else class="avatar-ph"><text>{{ (b.nickname||'友')[0] }}</text></view>
          </view>
          <text class="m-name">{{ b.nickname || '亲友' }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="selectedBinding" class="module-list">
      <view v-for="mod in modules" :key="mod.key" class="module-card">
        <view class="module-header">
          <view class="mod-left">
            <text class="mod-icon">{{ mod.icon }}</text>
            <text class="mod-label">{{ mod.label }}</text>
          </view>
          <view class="switch" :class="{ 'switch--on': mod.enabled }" @tap="toggleModule(mod)" />
        </view>
        <view v-if="mod.key === 'checkin' && mod.enabled" class="item-checklist">
          <view
            v-for="ci in checkinItems" :key="ci._id"
            class="check-row"
            @tap="toggleCheckinItem(ci)"
          >
            <view class="checkbox" :class="{ 'checkbox--checked': mod.selectedItems.includes(ci._id) }">
              <text v-if="mod.selectedItems.includes(ci._id)">✓</text>
            </view>
            <text class="check-name">{{ ci.name }}</text>
          </view>
        </view>
      </view>

      <view class="danger-card" @tap="unbind">
        <text class="danger-text">⚠️ 解除绑定</text>
        <text class="danger-sub">解绑后对方立即失去所有查看权限</text>
      </view>
    </view>

    <view v-else class="empty-tip"><text>请先选择一位亲友进行配置</text></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const bindings = ref([])
const selectedId = ref('')
const selectedBinding = ref(null)
const checkinItems = ref([])
const modules = ref([
  { key: 'checkin', icon: '✅', label: '打卡事项', enabled: false, selectedItems: [] },
  { key: 'rate', icon: '📊', label: '打卡完成率', enabled: false },
  { key: 'overdue', icon: '⏰', label: '逾期记录', enabled: false },
  { key: 'data', icon: '📈', label: '自定义数据记录', enabled: false },
  { key: 'timeline', icon: '🗓️', label: '个人时间线', enabled: false },
  { key: 'wish', icon: '✨', label: '心愿单（仅名称）', enabled: false }
])

function selectMember(b) {
  selectedId.value = b._id
  selectedBinding.value = b
  // TODO: 从 privacy_settings 加载该绑定的授权配置
}

function toggleModule(mod) {
  mod.enabled = !mod.enabled
  if (mod.key === 'checkin' && !mod.enabled) mod.selectedItems = []
  saveConfig()
}

function toggleCheckinItem(ci) {
  const mod = modules.value.find(m => m.key === 'checkin')
  if (!mod) return
  const idx = mod.selectedItems.indexOf(ci._id)
  if (idx === -1) mod.selectedItems.push(ci._id)
  else mod.selectedItems.splice(idx, 1)
  if (mod.enabled && mod.selectedItems.length === 0)
    uni.showToast({ title: '请至少选择一个事项', icon: 'none' })
  saveConfig()
}

function saveConfig() {
  // TODO: 调用云函数更新 privacy_settings，修改立即生效
}

function unbind() {
  uni.showModal({
    title: '确认解除绑定',
    content: '解绑后对方立即失去所有数据查看权限，且不可撤销。',
    confirmColor: '#FF3B30',
    success(res) {
      if (res.confirm) {
        // TODO: 调用云函数解除绑定
        uni.showToast({ title: '已解除绑定', icon: 'success' })
        selectedBinding.value = null
        selectedId.value = ''
      }
    }
  })
}

onMounted(() => {
  // TODO: 从云数据库加载绑定列表和打卡事项
})
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }
.member-bar { background: #fff; padding: 20rpx 24rpx; border-bottom: 1rpx solid #F0F2F7; }
.member-list { display: flex; gap: 24rpx; white-space: nowrap; }
.member-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; flex-shrink: 0; }
.member-item--active .m-avatar { outline: 3rpx solid #4F7CFF; border-radius: 50%; }
.avatar-img { width: 80rpx; height: 80rpx; border-radius: 50%; display: block; }
.avatar-ph { width: 80rpx; height: 80rpx; border-radius: 50%; background: #EEF2FF; display: flex; align-items: center; justify-content: center; font-size: 30rpx; color: #4F7CFF; font-weight: 700; }
.m-name { font-size: 22rpx; color: #6B7A99; }
.module-list { padding: 24rpx; display: flex; flex-direction: column; gap: 16rpx; }
.module-card { background: #fff; border-radius: 20rpx; padding: 24rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,.05); }
.module-header { display: flex; align-items: center; justify-content: space-between; }
.mod-left { display: flex; align-items: center; gap: 14rpx; }
.mod-icon { font-size: 32rpx; }
.mod-label { font-size: 28rpx; font-weight: 600; color: #2D3748; }
.switch { width: 92rpx; height: 56rpx; border-radius: 28rpx; background: #C8CFDE; position: relative; flex-shrink: 0; }
.switch::after { content: ''; position: absolute; width: 48rpx; height: 48rpx; background: #fff; border-radius: 50%; top: 4rpx; left: 4rpx; box-shadow: 0 2rpx 6rpx rgba(0,0,0,.2); transition: left 0.2s; }
.switch--on { background: #4F7CFF; }
.switch--on::after { left: 40rpx; }
.item-checklist { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #F0F2F7; display: flex; flex-direction: column; gap: 4rpx; }
.check-row { display: flex; align-items: center; gap: 16rpx; padding: 12rpx 0; }
.checkbox { width: 40rpx; height: 40rpx; border-radius: 8rpx; border: 2rpx solid #C8CFDE; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 24rpx; }
.checkbox--checked { background: #4F7CFF; border-color: #4F7CFF; color: #fff; }
.check-name { font-size: 26rpx; color: #4A5568; }
.danger-card { background: #FFF0EF; border: 1rpx solid #FFCDC9; border-radius: 20rpx; padding: 28rpx; text-align: center; }
.danger-text { font-size: 28rpx; font-weight: 700; color: #FF3B30; display: block; }
.danger-sub { font-size: 23rpx; color: #FF9999; display: block; margin-top: 8rpx; }
.empty-tip { padding: 80rpx 40rpx; text-align: center; font-size: 28rpx; color: #C8CFDE; }
</style>
