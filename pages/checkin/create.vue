<template>
  <view class="page dk-page">
    <scroll-view class="content" scroll-y>
      <view class="form-card dk-card">
        <view class="field">
          <text class="label">事项名称 <text class="req">*</text></text>
          <input
            class="input active name-input"
            :value="form.name"
            placeholder="请输入事项名称"
            maxlength="50"
            @input="form.name = $event.detail.value"
          />
        </view>

        <view class="field">
          <text class="label">打卡提醒时间 <text class="req">*</text></text>
          <picker mode="time" :value="form.remindTime" @change="form.remindTime = $event.detail.value">
            <view class="input picker-row">
              <text>{{ form.remindTime || '请选择时间' }}</text>
              <text class="arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="field">
          <text class="section-title">重复设置 <text class="req">*</text></text>
          <view class="chips">
            <view v-for="r in repeatOptions" :key="r.key" class="chip" :class="{ active: form.repeatType === r.key }" @tap="selectRepeat(r.key)">
              <text>{{ r.label }}</text>
            </view>
          </view>
        </view>

        <view v-if="form.repeatType === 'weekly'" class="panel">
          <text class="panel-title">选择重复日期（可多选）</text>
          <view class="week-grid">
            <view v-for="w in weekdays" :key="w.key" class="week-item" :class="{ active: form.repeatDays.includes(w.key) }" @tap="toggleWeekday(w.key)">
              <text>{{ w.label }}</text>
            </view>
          </view>
        </view>

        <view v-if="form.repeatType === 'monthly'" class="panel">
          <view class="month-row" @tap="form.repeatMonthType = 'date'">
            <view class="radio" :class="{ on: form.repeatMonthType === 'date' }"><view class="dot" v-if="form.repeatMonthType === 'date'" /></view>
            <text class="month-text">按日期：每月</text>
            <picker mode="selector" :range="dayRange" :value="form.repeatMonthDay - 1" @change="form.repeatMonthDay = Number($event.detail.value) + 1">
              <view class="day-box" :class="{ on: form.repeatMonthType === 'date' }"><text>{{ form.repeatMonthDay }}</text></view>
            </picker>
            <text class="month-text">日</text>
          </view>

          <view class="month-row" @tap="form.repeatMonthType = 'rule'">
            <view class="radio" :class="{ on: form.repeatMonthType === 'rule' }"><view class="dot" v-if="form.repeatMonthType === 'rule'" /></view>
            <text class="month-text" :class="{ dim: form.repeatMonthType !== 'rule' }">按规律：每月</text>
            <picker mode="selector" :range="monthRuleLabels" :value="monthRuleIndex" @change="onMonthRuleChange">
              <view class="rule-box" :class="{ on: form.repeatMonthType === 'rule' }">
                <text>{{ monthRuleLabel }}</text><text class="small-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="field">
          <text class="label">执行说明（选填）</text>
          <textarea
            class="input textarea"
            :value="form.description"
            maxlength="100"
            placeholder="请输入执行说明（最多100字）"
            @input="form.description = $event.detail.value"
          />
        </view>

        <view class="field">
          <text class="label">备注（选填）</text>
          <input
            class="input"
            :value="form.remark"
            maxlength="50"
            placeholder="请输入备注"
            @input="form.remark = $event.detail.value"
          />
        </view>

        <view class="field">
          <text class="label">目标总次数（选填）</text>
          <input
            class="input"
            type="number"
            :value="form.targetCount"
            placeholder="请输入数字"
            @input="form.targetCount = $event.detail.value"
          />
        </view>

        <view class="field">
          <text class="label">重要计划时间（选填）</text>
          <picker mode="date" :start="tomorrow" :value="form.planDate" @change="form.planDate = $event.detail.value">
            <view class="input picker-row">
              <text>{{ form.planDate || '请选择未来日期' }}</text>
              <text class="arrow">›</text>
            </view>
          </picker>
        </view>
      </view>
      <view style="height: 160rpx" />
    </scroll-view>

    <view class="bottom-bar">
      <view class="create-btn" @tap="submit"><text>创建</text></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
const db = wx.cloud.database()

const repeatOptions = [
  { key: 'daily', label: '每天' },
  { key: 'weekly', label: '每周' },
  { key: 'monthly', label: '每月' },
  { key: 'once', label: '仅一次' }
]
const weekdays = [
  { key: 1, label: '一' }, { key: 2, label: '二' }, { key: 3, label: '三' },
  { key: 4, label: '四' }, { key: 5, label: '五' }, { key: 6, label: '六' }, { key: 0, label: '日' }
]
const monthRules = [
  { key: 'last_day', label: '最后一天' },
  { key: 'first_day', label: '第一天' },
  { key: 'first_monday', label: '第一个周一' },
  { key: 'last_friday', label: '最后一个周五' }
]
const dayRange = Array.from({ length: 31 }, (_, i) => i + 1)

const form = ref({
  name: '', repeatType: 'daily', repeatDays: [], repeatMonthType: 'date', repeatMonthDay: 15,
  repeatMonthValue: 'last_day', remindTime: '07:30', description: '', remark: '', targetCount: '', planDate: ''
})

const monthRuleLabels = computed(() => monthRules.map((r) => r.label))
const monthRuleIndex = computed(() => Math.max(0, monthRules.findIndex((r) => r.key === form.value.repeatMonthValue)))
const monthRuleLabel = computed(() => monthRules[monthRuleIndex.value]?.label || '最后一天')

const tomorrow = computed(() => {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function onMonthRuleChange(e) { form.value.repeatMonthValue = monthRules[e.detail.value].key }
function selectRepeat(key) { form.value.repeatType = key; if (key !== 'weekly') form.value.repeatDays = [] }
function toggleWeekday(key) {
  const i = form.value.repeatDays.indexOf(key)
  if (i === -1) form.value.repeatDays.push(key)
  else form.value.repeatDays.splice(i, 1)
}
function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/checkin/index' })
  }
}

function submit() {
  const f = form.value
  if (!f.name.trim()) return uni.showToast({ title: '请填写事项名称', icon: 'none' })
  if (!f.remindTime) return uni.showToast({ title: '请设置提醒时间', icon: 'none' })
  if (f.repeatType === 'weekly' && f.repeatDays.length === 0) return uni.showToast({ title: '每周请至少选择一天', icon: 'none' })

  if (f.repeatType === 'weekly') {
    const today = new Date().getDay()
    const remain = f.repeatDays.some((d) => d >= today)
    if (!remain) {
      uni.showModal({ title: '提示', content: '本周剩余天数不足，是否从下周开始？', success: (res) => { if (res.confirm) createItem() } })
      return
    }
  }
  createItem()
}

async function createItem() {
  const f = form.value
  try {
    const res = await db.collection('checkin_items').add({
      data: {
        name: f.name.trim(),
        repeatType: f.repeatType,
        repeatDays: f.repeatType === 'weekly' ? f.repeatDays : [],
        repeatMonthType: f.repeatType === 'monthly' ? f.repeatMonthType : '',
        repeatMonthValue: f.repeatType === 'monthly' ? (f.repeatMonthType === 'date' ? String(f.repeatMonthDay) : f.repeatMonthValue) : '',
        remindTime: f.remindTime,
        status: 'active',
        description: f.description.trim(),
        remark: f.remark.trim(),
        targetCount: f.targetCount ? Number(f.targetCount) : null,
        planDate: f.planDate || '',
        createdAt: Date.now()
      }
    })

    // ★ 诊断日志：确认写入成功及新记录 ID
    console.log('✅ [create] 打卡事项创建成功，_id =', res._id)
    console.log('✅ [create]   repeatType =', f.repeatType)
    console.log('✅ [create]   repeatDays =', JSON.stringify(f.repeatDays))

    uni.showToast({ title: '创建成功', icon: 'success' })

    // ★ 延长等待时间到 800ms，确保云数据库写入已提交后再回退
    //    云数据库是最终一致的，过早查询可能读不到刚写入的记录
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.reLaunch({ url: '/pages/checkin/index' })
      }
    }, 800)
  } catch (e) {
    // ★ 错误日志：打印具体原因（权限/网络/字段校验等）
    console.error('❌ [create] 创建失败:', e)
    console.error('❌ [create]   错误详情:', JSON.stringify(e))
    uni.showToast({ title: `创建失败: ${e.errMsg || '未知错误'}`, icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
@import "@/uni.scss";

.page {
  padding-bottom: 196rpx;
}

.name-input {
  height: 92rpx;
  padding: 0 24rpx;
  line-height: 92rpx;
  font-size: 32rpx;
  border-radius: 16rpx;
}

.top-bar {
  height: 96rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1rpx solid $dk-divider;
}

.top-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: $dk-divider;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $dk-text-second;
}

.top-title {
  font-size: $dk-font-lg;
  font-weight: 700;
  color: $dk-text-primary;
}

.top-save {
  font-size: $dk-font-base;
  color: $dk-brand;
  font-weight: 700;
}

.content {
  height: calc(100vh - 96rpx);
}

.form-card {
  margin: 28rpx 16rpx 0;
  padding: 32rpx 28rpx 24rpx;
}

.field {
  margin-bottom: 30rpx;
}

.label,
.section-title {
  display: block;
  margin-bottom: 12rpx;
  font-size: $dk-font-sm;
  color: $dk-text-second;
  font-weight: 600;
}

.section-title {
  font-size: $dk-font-base;
  color: $dk-text-primary;
  font-weight: 800;
  margin-bottom: 12rpx;
}

.req {
  color: $dk-danger;
}

.input {
  width: 100%;
  box-sizing: border-box;
  background: $dk-bg;
  border: 1.5px solid $dk-border;
  border-radius: 18rpx;
  padding: 24rpx 24rpx;
  font-size: 30rpx;
  color: $dk-text-primary;
}

.input.active {
  border-color: $dk-brand;
  background: #fff;
}

.textarea {
  height: 182rpx;
}

.picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.arrow {
  color: #c8cfde;
  font-size: 30rpx;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 4rpx;
}

.chip {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: $dk-divider;
  color: $dk-text-second;
  font-size: $dk-font-sm;
}

.chip.active {
  background: $dk-brand-light;
  color: $dk-brand;
}

.panel {
  background: $dk-bg;
  border-radius: 20rpx;
  padding: 20rpx;
  margin: -6rpx 0 22rpx;
}

.panel-title {
  display: block;
  margin-bottom: 12rpx;
  font-size: $dk-font-xs;
  color: $dk-text-second;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
}

.week-item {
  aspect-ratio: 1;
  border-radius: 12rpx;
  background: $dk-divider;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $dk-text-second;
}

.week-item.active {
  background: $dk-brand;
  color: #fff;
}

.month-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 0;
}

.radio {
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  border: 2px solid #c8cfde;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio.on {
  border-color: $dk-brand;
}

.dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: $dk-brand;
}

.month-text {
  font-size: $dk-font-sm;
  color: $dk-text-primary;
}

.month-text.dim {
  color: $dk-text-disable;
}

.day-box,
.rule-box {
  background: #fff;
  border: 1.5px solid $dk-border;
  border-radius: 12rpx;
  color: $dk-text-disable;
}

.day-box {
  width: 70rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.rule-box {
  height: 52rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 0 14rpx;
  font-size: $dk-font-xs;
}

.day-box.on,
.rule-box.on {
  border-color: $dk-brand;
  color: $dk-brand;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 16rpx 36rpx;
  background: #fff;
  border-top: 1rpx solid $dk-divider;
}

.create-btn {
  width: 100%;
  border-radius: $dk-radius-btn;
  background: $dk-brand;
  color: #fff;
  text-align: center;
  padding: 28rpx 0;
  font-size: 32rpx;
  font-weight: 700;
}
</style>
