/**
 * generateInviteCode - 生成协同绑定邀请码
 * 功能：
 * 1. 检查当前用户绑定数量是否已达5人上限
 * 2. 生成6位邀请码（排除 I/O/0/1 等歧义字符）
 * 3. 向 bindings 集合写入 pending 记录
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 邀请码字符集（排除 I/O/0/1/2 易混淆字符）
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const MAX_RETRIES = 5
const INVITE_TTL = 24 * 60 * 60 * 1000 // 24小时（毫秒）

/**
 * 生成指定长度的随机邀请码
 * @param {number} length
 * @returns {string}
 */
function generateCode(length) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

/**
 * 检查邀请码是否与现有 pending 记录重复
 * @param {string} code
 * @returns {Promise<boolean>} true=有冲突，false=可用
 */
async function isCodeDuplicate(code) {
  const resp = await db.collection('bindings')
    .where({
      inviteCode: code,
      status: 'pending'
    })
    .count()
  return resp.total > 0
}

/**
 * 生成唯一的邀请码（最多重试 MAX_RETRIES 次）
 * @returns {Promise<string>}
 */
async function generateUniqueCode() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = generateCode(CODE_LENGTH)
    const isDup = await isCodeDuplicate(code)
    if (!isDup) return code
  }
  throw new Error('CODE_GEN_FAILED')
}

exports.main = async (event, context) => {
  const { role } = event

  // 1. 获取 openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) {
    return { success: false, errCode: 'NO_OPENID', errMsg: '无法获取用户身份' }
  }

  // 2. 参数校验
  if (!role || (role !== 'supervisor' && role !== 'supervisee')) {
    return { success: false, errCode: 'INVALID_ROLE', errMsg: '角色参数不正确' }
  }

  // 3. 查询当前用户已激活绑定数量
  const countResp = await db.collection('bindings')
    .where(_.or(
      { supervisorOpenid: openid },
      { superviseeOpenid: openid }
    ))
    .count()
  if (countResp.total >= 5) {
    return {
      success: false,
      errCode: 'BINDING_FULL',
      errMsg: '您已绑定5位亲友，请先解绑后再试'
    }
  }

  // 4. 生成唯一邀请码
  let inviteCode
  try {
    inviteCode = await generateUniqueCode()
  } catch (e) {
    return { success: false, errCode: 'CODE_GEN_FAILED', errMsg: '邀请码生成失败，请稍后重试' }
  }

  const now = Date.now()
  const expireAt = now + INVITE_TTL

  // 5. 写入 bindings 集合
  const addResp = await db.collection('bindings').add({
    data: {
      inviteCode,
      inviteExpireAt: expireAt,
      status: 'pending',
      supervisorOpenid: role === 'supervisor' ? openid : '',
      superviseeOpenid: role === 'supervisee' ? openid : '',
      createdAt: now
    }
  })

  return {
    success: true,
    inviteCode,
    expireAt
  }
}