<!-- code\dakaban\components\DakaCard.vue -->
<template>
  <view class="daka-card" :class="'daka-card--' + status">
    <view class="daka-card__left">
      <view class="daka-card__dot" :class="'daka-card__dot--' + status" />
      <view class="daka-card__info">
        <text class="daka-card__title">{{ title }}</text>
        <text v-if="subtitle" class="daka-card__subtitle">{{ subtitle }}</text>
      </view>
    </view>
    <view class="daka-card__right">
      <view class="dk-badge" :class="badgeClass">
        <text>{{ statusLabel }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 事项名称
  title: {
    type: String,
    required: true
  },
  // 补充说明，如重复规则或提醒时间
  subtitle: {
    type: String,
    default: ''
  },
  // done: 已完成 | miss: 已逾期 | part: 部分完成 | none: 未打卡
  status: {
    type: String,
    default: 'none',
    validator: (v) => ['done', 'miss', 'part', 'none'].includes(v)
  }
})

const STATUS_MAP = {
  done: { label: '已完成', badge: 'dk-badge--done' },
  miss: { label: '已逾期', badge: 'dk-badge--miss' },
  part: { label: '部分完成', badge: 'dk-badge--part' },
  none: { label: '未打卡', badge: 'dk-badge--none' }
}

const statusLabel = computed(() => STATUS_MAP[props.status]?.label ?? '未知')
const badgeClass  = computed(() => STATUS_MAP[props.status]?.badge  ?? 'dk-badge--none')
</script>

<style lang="scss" scoped>
.daka-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(79, 124, 255, 0.08);
  border-left: 8rpx solid transparent;
  transition: border-color 0.2s;

  // 左侧彩色竖线：根据状态着色
  &--done { border-left-color: #34C759; }
  &--miss { border-left-color: #FF3B30; }
  &--part { border-left-color: #FF9500; }
  &--none { border-left-color: #E4E8F0; }
}

.daka-card__left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  overflow: hidden;
}

.daka-card__dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  flex-shrink: 0;

  &--done { background: #34C759; }
  &--miss { background: #FF3B30; }
  &--part { background: #FF9500; }
  &--none { background: #C8CFDE; }
}

.daka-card__info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  overflow: hidden;
}

.daka-card__title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1A2033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.daka-card__subtitle {
  font-size: 24rpx;
  color: #9AA5BE;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.daka-card__right {
  flex-shrink: 0;
  margin-left: 16rpx;
}

// dk-badge 依赖全局 App.vue 中定义的样式
// done / miss / part / none 四种状态颜色已在 App.vue 中全局声明
</style>
