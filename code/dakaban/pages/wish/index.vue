<template>
  <view class="page">
    <!-- S11: 心愿单 -->
    <scroll-view class="filter-bar" scroll-x="true">
      <view class="filter-list">
        <view
          v-for="tab in statusTabs" :key="tab.key"
          class="filter-tab"
          :class="{ 'filter-tab--active': activeTab === tab.key }"
          @tap="activeTab = tab.key"
        ><text>{{ tab.label }}</text></view>
      </view>
    </scroll-view>

    <view class="wish-list">
      <view v-if="filteredWishes.length === 0" class="dk-empty">
        <text class="dk-empty__icon">✨</text>
        <text class="dk-empty__title">还没有心愿</text>
        <text class="dk-empty__sub">记录下你想实现的目标吧</text>
      </view>
      <view v-for="wish in filteredWishes" :key="wish._id" class="wish-card">
        <view class="wish-header">
          <text class="wish-name">{{ wish.name }}</text>
          <view class="dk-badge" :class="getStatusBadge(wish.status)">
            <text>{{ getStatusLabel(wish.status) }}</text>
          </view>
        </view>
        <text v-if="wish.description" class="wish-desc dk-text-sub">{{ wish.description }}</text>
        <view v-if="wish.targetDate" class="wish-meta">
          <text class="dk-text-sub">🎯 {{ wish.targetDate }}</text>
        </view>
        <view v-if="wish.status === 'active'" class="wish-actions">
          <view class="wish-btn wish-btn--light" @tap="convertToCheckin(wish)"><text>转为打卡事项</text></view>
          <view class="wish-btn wish-btn--green" @tap="markDone(wish)"><text>已实现 🎉</text></view>
        </view>
      </view>
    </view>

    <view class="add-wish" @tap="goCreate">
      <text class="add-plus">＋</text>
      <text class="dk-text-sub">新增心愿</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const wishes = ref([])
const activeTab = ref('all')

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待开始' },
  { key: 'active', label: '进行中' },
  { key: 'done', label: '已实现' },
  { key: 'shelved', label: '已搁置' }
]

const filteredWishes = computed(() =>
  activeTab.value === 'all' ? wishes.value : wishes.value.filter(w => w.status === activeTab.value)
)

function getStatusLabel(s) {
  return { pending: '待开始', active: '进行中', done: '已实现', shelved: '已搁置' }[s] || s
}

function getStatusBadge(s) {
  return { pending: 'dk-badge--none', active: 'dk-badge--brand', done: 'dk-badge--done', shelved: 'dk-badge--part' }[s] || 'dk-badge--none'
}

function convertToCheckin(wish) {
  uni.navigateTo({ url: `/pages/checkin/create?wishName=${encodeURIComponent(wish.name)}` })
}

function markDone(wish) {
  // TODO: 调用云函数更新状态为 done
  uni.showToast({ title: '已标记为实现！', icon: 'success' })
}

function goCreate() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

onMounted(() => {
  // TODO: 从云数据库加载心愿列表
})
</script>

<style scoped>
.page { min-height: 100vh; background: #F8F9FB; display: flex; flex-direction: column; }

/* 筛选标签栏 */
.filter-bar { background: #FFFFFF; padding: 16rpx 24rpx; border-bottom: 2rpx solid #F0F2F7; flex-shrink: 0; }
.filter-list { display: flex; gap: 16rpx; white-space: nowrap; }
.filter-tab {
  padding: 10rpx 28rpx; border-radius: 40rpx;
  background: #F0F2F7; font-size: 26rpx;
  color: #6B7A99; font-weight: 500; flex-shrink: 0;
}
.filter-tab--active { background: #4F7CFF; color: #FFFFFF; font-weight: 700; }

/* 心愿列表 */
.wish-list { flex: 1; padding: 24rpx; }

/* 心愿卡片 — 对齐①规范 */
.wish-card {
  background: #FFFFFF; border-radius: 32rpx;
  padding: 32rpx; margin-bottom: 24rpx;
  border: 2rpx solid #F0F2F7;
}
.wish-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.wish-name { font-size: 28rpx; font-weight: 700; color: #1A2033; flex: 1; margin-right: 16rpx; }
.wish-desc { display: block; line-height: 1.6; margin-bottom: 12rpx; }
.wish-meta { margin-bottom: 16rpx; }

/* 操作按钮 */
.wish-actions { display: flex; gap: 16rpx; margin-top: 16rpx; }
.wish-btn {
  flex: 1; text-align: center;
  padding: 16rpx; border-radius: 24rpx;
  font-size: 26rpx; font-weight: 600;
}
.wish-btn--light { background: #EEF2FF; color: #4F7CFF; }
.wish-btn--green { background: #EDFAF2; color: #34C759; }

/* 新增按钮 */
.add-wish {
  margin: 0 24rpx 40rpx;
  display: flex; flex-direction: column; align-items: center;
  padding: 40rpx; border: 2rpx dashed #C8CFDE;
  border-radius: 32rpx; gap: 12rpx; background: #FFFFFF;
}
.add-plus { font-size: 48rpx; color: #9AA5BE; }
</style>
