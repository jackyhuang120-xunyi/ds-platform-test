import jwt from 'jsonwebtoken';

const login = async (req, res) => {
  const { username, password } = req.body;

  // 从环境变量获取管理员凭据
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (username === adminUser && password === adminPass) {
    // 生成 JWT
    const token = jwt.sign(
      { username: adminUser, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: '登录成功',
      token
    });
  }

  return res.status(401).json({
    success: false,
    message: '用户名或密码错误'
  });
};

export default {
  login
};
