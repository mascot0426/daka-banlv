<template>
  <view class="page">
    <!-- S4: 新建打卡事项 -->
    <scroll-view scroll-y class="form-scroll">
      <view class="form">

        <!-- 事项名称 -->
        <view class="field-group">
          <text class="field-label">事项名称 <text class="req">*</text></text>
          <input class="field-input" v-model="form.name" placeholder="输入事项名称（最多50字）" maxlength="50" />
        </view>

        <!-- 重复周期 -->
        <view class="field-group">
          <text class="field-label">重复周期 <text class="req">*</text></text>
          <view class="repeat-tabs">
            <view
              v-for="r in repeatOptions" :key="r.key"
              class="repeat-tab"
              :class="{ 'repeat-tab--active': form.repeatType === r.key }"
              @tap="selectRepeat(r.key)"
            ><text>{{ r.label }}</text></view>
          </view>
        </view>

        <!-- 每周：选择星期 -->
        <view v-if="form.repeatType === 'weekly'" class="field-group">
          <text class="field-label">选择打卡日期（至少选1天）</text>
          <view class="week-picker">
            <view
              v-for="w in weekdays" :key="w.key"
              class="week-item"
              :class="{ 'week-item--selected': form.repeatDays.includes(w.key) }"
              @tap="toggleWeekday(w.key)"
            ><text>{{ w.label }}</text></view>
          </view>
        </view>

        <!-- 每月：选择方式 -->
        <view v-if="form.repeatType === 'monthly'" class="field-group">
          <text class="field-label">每月重复方式</text>
          <view class="month-type-tabs">
            <view class="month-type-tab" :class="{ 'month-type-tab--active': form.repeatMonthType === 'date' }" @tap="form.repeatMonthType = 'date'"><text>按日期</text></view>
            <view class="month-type-tab" :class="{ 'month-type-tab--active': form.repeatMonthType === 'rule' }" @tap="form.repeatMonthType = 'rule'"><text>按规律</text></view>
          </view>
          <view v-if="form.repeatMonthType === 'date'" class="sub-field">
            <picker mode="selector" :range="dayRange" :value="form.repeatMonthDay - 1" @change="form.repeatMonthDay = $event.detail.value + 1">
              <view class="picker-val"><text>每月第 {{ form.repeatMonthDay }} 日</text></view>
            </picker>
          </view>
          <view v-if="form.repeatMonthType === 'rule'" class="sub-field">
            <view
              v-for="rule in monthRules" :key="rule.key"
              class="rule-item"
              :class="{ 'rule-item--active': form.repeatMonthValue === rule.key }"
              @tap="form.repeatMonthValue = rule.key"
            ><text>{{ rule.label }}</text></view>
          </view>
        </view>

        <!-- 提醒时间 -->
        <view class="field-group">
          <text class="field-label">打卡提醒时间 <text class="req">*</text></text>
          <picker mode="time" :value="form.remindTime" @change="form.remindTime = $event.detail.value">
            <view class="picker-val"><text>{{ form.remindTime || '请选择时间' }}</text></view>
          </picker>
        </view>

        <!-- 执行说明 -->
        <view class="field-group">
          <text class="field-label">执行说明（选填）</text>
          <textarea class="field-input field-textarea" v-model="form.description" placeholder="描述执行标准或方法..." maxlength="200" />
        </view>

        <!-- 备注 -->
        <view class="field-group">
          <text class="field-label">备注（选填）</text>
          <input class="field-input" v-model="form.remark" placeholder="添加备注" maxlength="100" />
        </view>

        <!-- 目标次数 -->
        <view class="field-group">
          <text class="field-label">计划执行次数（选填）</text>
          <input class="field-input" v-model="form.targetCount" type="number" placeholder="例如：30" />
        </view>

        <!-- 目标日期 -->
        <view class="field-group">
          <text class="field-label">目标日期（选填）</text>
          <picker mode="date" :value="form.planDate" @change="form.planDate = $event.detail.value">
            <view class="picker-val"><text>{{ form.planDate || '选择目标日期' }}</text></view>
          </picker>
        </view>

        <view class="submit-btn" @tap="submit"><text>创建事项</text></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const repeatOptions = [
  { key: 'daily', label: '每天' }, { key: 'weekly', label: '每周' },
  { key: 'monthly', label: '每月' }, { key: 'once', label: '仅一次' }
]
const weekdays = [
  { key: 1, label: '一' }, { key: 2, label: '二' }, { key: 3, label: '三' },
  { key: 4, label: '四' }, { key: 5, label: '五' }, { key: 6, label: '六' }, { key: 0, label: '日' }
]
const monthRules = [
  { key: 'firstDay', label: '每月第一天' }, { key: 'lastDay', label: '每月最后一天' },
  { key: 'firstMonday', label: '每月第一个周一' }, { key: 'lastFriday', label: '每月最后一个周五' }
]
const dayRange = Array.from({ length: 31 }, (_, i) => `${i + 1}`)

const form = ref({
  name: '', repeatType: 'daily', repeatDays: [],
  repeatMonthType: 'date', repeatMonthDay: 1, repeatMonthValue: 'lastDay',
  remindTime: '08:00', description: '', remark: '', targetCount: '', planDate: ''
})

function selectRepeat(key) { form.value.repeatType = key; form.value.repeatDays = [] }

function toggleWeekday(key) {
  const days = form.value.repeatDays
  const idx = days.indexOf(key)
  if (idx === -1) days.push(key); else days.splice(idx, 1)
}

function submit() {
  const f = form.value
  if (!f.name.trim()) return uni.showToast({ title: '请填写事项名称', icon: 'none' })
  if (f.repeatType === 'weekly' && f.repeatDays.length === 0)
    return uni.showToast({ title: '请至少选择一天', icon: 'none' })
  if (!f.remindTime) return uni.showToast({ title: '请设置提醒时间', icon: 'none' })
  if (f.repeatType === 'weekly') {
    const todayDay = new Date().getDay()
    const remaining = f.repeatDays.filter(d => d > todayDay)
    if (remaining.length === 0) {
      uni.showModal({
        title: '提示', content: '本周剩余天数不足，是否从下周开始计算？',
        success(res) { if (res.confirm) createItem() }
      })
      return
    }
  }
  createItem()
}

function createItem() {
  // TODO: 调用云函数写入 checkin_items 集合
  uni.showToast({ title: '创建成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 1000)
}

onMounted(() => {
  const pages = getCurrentPages()
  const wishName = pages[pages.length - 1]?.options?.wishName
  if (wishName) form.value.name = decodeURIComponent(wishName)
})
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; }
.form-scroll { height: 100vh; }
.form { padding: 24rpx 24rpx 60rpx; }
.field-group { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.field-label { font-size: 26rpx; font-weight: 700; color: #4A5568; display: block; margin-bottom: 12rpx; }
.req { color: #FF3B30; }
.field-input { width: 100%; background: #F8F9FB; border: 2rpx solid #E4E8F0; border-radius: 12rpx; padding: 18rpx 20rpx; font-size: 28rpx; color: #2D3748; box-sizing: border-box; }
.field-textarea { height: 140rpx; }
.repeat-tabs { display: flex; gap: 12rpx; flex-wrap: wrap; }
.repeat-tab { padding: 12rpx 28rpx; border-radius: 20rpx; background: #F0F2F7; font-size: 26rpx; color: #6B7A99; font-weight: 500; }
.repeat-tab--active { background: #4F7CFF; color: #fff; font-weight: 700; }
.week-picker { display: flex; gap: 12rpx; flex-wrap: wrap; margin-top: 12rpx; }
.week-item { width: 72rpx; height: 72rpx; border-radius: 50%; background: #F0F2F7; display: flex; align-items: center; justify-content: center; font-size: 26rpx; color: #6B7A99; font-weight: 600; }
.week-item--selected { background: #4F7CFF; color: #fff; }
.month-type-tabs { display: flex; gap: 12rpx; margin-bottom: 16rpx; }
.month-type-tab { flex: 1; text-align: center; padding: 14rpx; border-radius: 14rpx; background: #F0F2F7; font-size: 26rpx; color: #6B7A99; }
.month-type-tab--active { background: #4F7CFF; color: #fff; font-weight: 700; }
.sub-field { margin-top: 8rpx; }
.rule-item { padding: 18rpx 20rpx; border-radius: 12rpx; background: #F8F9FB; margin-bottom: 10rpx; font-size: 27rpx; color: #4A5568; border: 2rpx solid transparent; }
.rule-item--active { border-color: #4F7CFF; background: #EEF2FF; color: #4F7CFF; font-weight: 600; }
.picker-val { background: #F8F9FB; border: 2rpx solid #E4E8F0; border-radius: 12rpx; padding: 18rpx 20rpx; font-size: 28rpx; color: #2D3748; }
.submit-btn { margin-top: 24rpx; background: #4F7CFF; color: #fff; text-align: center; padding: 30rpx; border-radius: 20rpx; font-size: 30rpx; font-weight: 700; }
</style>
