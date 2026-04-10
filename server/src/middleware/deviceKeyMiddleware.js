/**
 * 设备密钥中间件（Device API Key）
 * 适用于平板等离线采集设备的自动同步场景。
 *
 * 客户端请求时，需在 Header 中携带：
 *   X-Device-Key: <与服务端 .env 中 DEVICE_API_KEY 一致的密钥>
 *
 * 与 JWT 的区别：
 *   - JWT：短期有效（通常几小时到几天），需要人工登录刷新
 *   - Device Key：长期静态密钥，程序配置一次永久有效，适合自动同步
 */
const deviceKeyMiddleware = (req, res, next) => {
  const clientKey = req.headers['x-device-key'];
  const serverKey = process.env.DEVICE_API_KEY;

  if (!serverKey) {
    // 服务端未配置密钥时，打印警告但放行（方便本地开发调试）
    console.warn('[DEVICE-KEY] ⚠️  警告：DEVICE_API_KEY 未在 .env 中配置，当前跳过验证（仅限开发环境）');
    return next();
  }

  if (!clientKey || clientKey !== serverKey) {
    console.warn(`[DEVICE-KEY] ❌ 拒绝请求：设备密钥不匹配，来源 IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: '设备密钥无效，拒绝同步请求'
    });
  }

  console.log(`[DEVICE-KEY] ✅ 设备身份验证通过，来源 IP: ${req.ip}`);
  next();
};

export default deviceKeyMiddleware;
