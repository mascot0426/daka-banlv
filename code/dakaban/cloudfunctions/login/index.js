// 云函数：login
// 功能：通过云开发获取 openid，查询或新建用户记录
// 隐私合规：仅使用 openid，不收集手机号/实名（§5.2 §3.1）

const cloud = require('wx-server-sdk')

// 初始化云开发（使用当前云环境）
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCol = db.collection('users')

exports.main = async (event, context) => {
  // 通过云开发上下文直接获取 openid，无需手动调用 code2Session
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      errMsg: '无法获取 openid，请检查云环境配置'
    }
  }

  try {
    // 查询 users 集合中是否存在该 openid
    const queryRes = await usersCol
      .where({ _openid: openid })
      .limit(1)
      .get()

    let isNewUser = false

    if (queryRes.data.length === 0) {
      // 用户不存在，新建记录
      // 注意：云数据库会自动以当前调用者的 openid 作为 _openid 字段值
      await usersCol.add({
        data: {
          _openid: openid,
          nickname: '',
          avatarUrl: '',
          privacyAgreed: false,
          createdAt: Date.now()
        }
      })
      isNewUser = true
    }

    return {
      success: true,
      openid,
      isNewUser
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '数据库操作失败'
    }
  }
}
