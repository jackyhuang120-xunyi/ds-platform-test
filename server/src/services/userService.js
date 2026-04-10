import userModel from '../models/userModel.js';

/**
 * 分页获取所有用户 (UserList 使用)
 */
async function listUsers(filters, page, pageSize) {
  return await userModel.getAllUsers(filters, page, pageSize);
}

/**
 * 获取用户个人资料汇总 (UserSummary 使用)
 */
async function getUserProfile(id) {
  const [user, stats, pb, recentRecords] = await Promise.all([
    userModel.getUserById(id),
    userModel.getUserStats(id),
    userModel.getUserPB(id),
    userModel.getUserRecentRecords(id, { page: 1, pageSize: 10 })
  ]);

  if (!user) return null;

  return {
    ...user,
    stats,
    pb,
    recentRecords
  };
}

/**
 * 分页获取用户训练记录
 */
async function getUserRecords(id, params) {
  return await userModel.getUserRecentRecords(id, params);
}

/**
 * 获取训练记录趋势数据
 */
async function getUserTrend(id, typeId, limit) {
  return await userModel.getUserTrendData(id, typeId, limit);
}

/**
 * 获取用户巅峰时刻
 */
async function getUserGloryMoments(id) {
  return await userModel.getUserGloryMoments(id);
}

/**
 * 幂等创建新用户：插入前先查重指纹 (姓名+生日)
 * 返回 { id, isNew, data? }
 */
async function idempotentCreate(userData) {
  const { name, birthday } = userData;
  const existingUser = await userModel.findByFingerprint(name, birthday);
  
  if (existingUser) {
    return { id: existingUser.id, isNew: false, data: existingUser };
  }

  const insertId = await userModel.create(userData);
  return { id: insertId, isNew: true };
}

/**
 * 全量更新用户信息
 */
async function updateUser(id, userData) {
  return await userModel.update(id, userData);
}

export default {
  listUsers,
  getUserProfile,
  getUserRecords,
  getUserTrend,
  getUserGloryMoments,
  idempotentCreate,
  updateUser
};
