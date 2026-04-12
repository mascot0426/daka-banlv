<template>
  <view class="page">
    <!-- S6: 自定义数据记录主页 -->
    <view class="empty-state" v-if="dataItems.length === 0">
      <text class="empty-icon">📊</text>
      <text class="empty-title">还没有数据记录项</text>
      <text class="empty-sub">点击下方按钮创建第一个数据项</text>
      <view class="btn btn-primary" @tap="createItem">+ 新建数据项</view>
    </view>
    <view v-else class="content">
      <view v-for="item in dataItems" :key="item._id" class="data-card">
        <text class="data-name">{{ item.name }}</text>
        <text class="data-unit">单位：{{ item.unit }}</text>
        <!-- TODO: 折线图区域 -->
        <view class="chart-placeholder"><text>折线图（待实现）</text></view>
        <view class="record-btn" @tap="recordValue(item)">录入数据</view>
      </view>
      <view class="add-btn" @tap="createItem">+ 新建数据项</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const dataItems = ref([])

function createItem() {
  // TODO: 跳转至新建数据项表单
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function recordValue(item) {
  // TODO: 跳转录入数据页
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

onMounted(() => {
  // TODO: 从云数据库加载数据项
})
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 160rpx 40rpx;
  gap: 20rpx;
}
.empty-icon { font-size: 80rpx; }
.empty-title { font-size: 32rpx; font-weight: 700; color: #2D3748; }
.empty-sub { font-size: 26rpx; color: #9AA5BE; text-align: center; }
.btn-primary {
  margin-top: 16rpx;
  background: #4F7CFF;
  color: #fff;
  padding: 20rpx 48rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.data-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.data-name { font-size: 30rpx; font-weight: 700; color: #2D3748; display: block; }
.data-unit { font-size: 24rpx; color: #9AA5BE; display: block; margin-top: 6rpx; }
.chart-placeholder {
  background: #F5F6FA;
  border-radius: 12rpx;
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16rpx 0;
  color: #9AA5BE;
  font-size: 24rpx;
}
.record-btn {
  background: #EEF2FF;
  color: #4F7CFF;
  text-align: center;
  padding: 16rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
}
.add-btn {
  text-align: center;
  color: #4F7CFF;
  font-size: 28rpx;
  font-weight: 600;
  padding: 28rpx;
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx dashed #4F7CFF;
}
</style>
