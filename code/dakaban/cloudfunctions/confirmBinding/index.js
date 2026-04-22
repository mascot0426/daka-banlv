/**
 * confirmBinding - 确认或拒绝协同绑定邀请
 * 功能：
 * 1. 校验邀请码格式与有效性
 * 2. 确认/拒绝绑定（更新 status）
 * 3. 向发起方写入通知消息
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const CODE_REGEX = /^[A-Z0-9]{6}$/

exports.main = async (event, context) => {
  const { inviteCode, action } = event

  // 1. 获取当前用户 openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) {
    return { success: false, errCode: 'NO_OPENID', errMsg: '无法获取用户身份' }
  }

  // 2. 参数校验
  if (!inviteCode || !CODE_REGEX.test(inviteCode)) {
    return { success: false, errCode: 'INVALID_CODE', errMsg: '邀请码格式不正确' }
  }
  if (!action || (action !== 'confirm' && action !== 'reject')) {
    return { success: false, errCode: 'INVALID_ACTION', errMsg: 'action 参数非法' }
  }

  // 3. 查询 pending 邀请码记录
  const records = await db.collection('bindings')
    .where({
      inviteCode,
      status: 'pending'
    })
    .get()

  if (records.data.length === 0) {
    return { success: false, errCode: 'CODE_NOT_FOUND', errMsg: '邀请码不存在或已失效' }
  }

  const binding = records.data[0] // 取 createdAt 最早的一条
  const bindingId = binding._id

  // 4. 验证是否过期
  if (binding.inviteExpireAt <= Date.now()) {
    return { success: false, errCode: 'CODE_EXPIRED', errMsg: '邀请码已过期' }
  }

  // 5. 检查当前用户是否已是该绑定关系的某一方
  if (binding.supervisorOpenid === openid || binding.superviseeOpenid === openid) {
    return { success: false, errCode: 'ALREADY_BINDING', errMsg: '不能接受自己发出的邀请' }
  }

  const now = Date.now()

  if (action === 'confirm') {
    // 6a. 确认绑定：补全空缺方的 openid
    const updateData = { status: 'active' }
    if (!binding.supervisorOpenid) {
      updateData.supervisorOpenid = openid
    } else {
      updateData.superviseeOpenid = openid
    }

    await db.collection('bindings').doc(bindingId).update({ data: updateData })

    // 通知发起方
    const notifyToOpenid = binding.supervisorOpenid || binding.superviseeOpenid
    await db.collection('notifications').add({
      data: {
        toOpenid: notifyToOpenid,
        type: 'binding_confirmed',
        content: '对方已确认绑定，你们现在是协同关系',
        isRead: false,
        createdAt: now
      }
    })

    return {
      success: true,
      bindingId,
      role: updateData.supervisorOpenid === openid ? 'supervisor' : 'supervisee',
      createdAt: binding.createdAt
    }

  } else {
    // 6b. 拒绝绑定
    await db.collection('bindings').doc(bindingId).update({
      data: { status: 'rejected' }
    })

    // 通知发起方
    const notifyToOpenid = binding.supervisorOpenid || binding.superviseeOpenid
    await db.collection('notifications').add({
      data: {
        toOpenid: notifyToOpenid,
        type: 'binding_rejected',
        content: '对方拒绝了你的绑定邀请',
        isRead: false,
        createdAt: now
      }
    })

    return { success: true }
  }
}