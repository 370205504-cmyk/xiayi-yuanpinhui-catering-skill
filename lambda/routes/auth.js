const express = require('express');
const { requireAuth, refreshAccessToken, revokeToken } = require('../middleware/auth');
const authService = require('../services/authService');
const AuditLogger = require('../services/auditLogger');
const DataSanitizer = require('../services/dataSanitizer');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname, verification_code } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, code: 1002, message: '手机号和密码不能为空' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, code: 1002, message: '密码长度至少8位' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        code: 1002, 
        message: '密码必须包含大小写字母、数字和特殊字符' 
      });
    }

    const result = await authService.register({ phone, password, nickname });

    AuditLogger.logRegister(result.userId, req.ip, req.get('user-agent'));

    res.status(201).json({
      success: true,
      code: 0,
      message: '注册成功',
      data: {
        userId: result.userId,
        mustChangePassword: false
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, code: 1000, message: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, code: 1002, message: '手机号和密码不能为空' });
    }

    const result = await authService.login(phone, password);

    if (!result.success) {
      AuditLogger.logLogin(null, req.ip, req.get('user-agent'), false);
      return res.status(401).json({ success: false, code: 1001, message: result.message });
    }

    const sanitizedUser = DataSanitizer.sanitizeUserData(result.user);
    const tokens = result.tokens;

    res.cookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 * 1000
    });

    AuditLogger.logLogin(result.user.id, req.ip, req.get('user-agent'), true);

    const responseData = {
      user: sanitizedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600
    };

    if (result.user.must_change_password) {
      responseData.requirePasswordChange = true;
      responseData.message = '首次登录请修改密码';
    }

    res.json({
      success: true,
      code: 0,
      message: '登录成功',
      data: responseData
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, code: 1000, message: '登录失败' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, code: 1002, message: '刷新令牌不能为空' });
    }

    const tokens = await refreshAccessToken(refreshToken);

    if (!tokens) {
      return res.status(401).json({ success: false, code: 1001, message: '刷新令牌无效或已过期' });
    }

    res.json({
      success: true,
      code: 0,
      message: '令牌刷新成功',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600
      }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ success: false, code: 1000, message: '令牌刷新失败' });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    await revokeToken(token);
    AuditLogger.logLogout(req.userId, req.ip, req.get('user-agent'));

    res.clearCookie('token');

    res.json({ success: true, code: 0, message: '退出登录成功' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, code: 1000, message: '退出登录失败' });
  }
});

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, code: 1002, message: '旧密码和新密码不能为空' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, code: 1002, message: '新密码长度至少8位' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        code: 1002, 
        message: '新密码必须包含大小写字母、数字和特殊字符' 
      });
    }

    const result = await authService.changePassword(userId, oldPassword, newPassword);

    if (!result.success) {
      return res.status(400).json({ success: false, code: 1002, message: result.message });
    }

    AuditLogger.logPasswordChange(userId, req.ip, req.get('user-agent'));

    res.json({ success: true, code: 0, message: '密码修改成功' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, code: 1000, message: '密码修改失败' });
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await authService.getProfile(req.userId);
    const sanitizedUser = DataSanitizer.sanitizeUserData(user);

    res.json({
      success: true,
      code: 0,
      message: '获取成功',
      data: sanitizedUser
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ success: false, code: 1000, message: '获取用户信息失败' });
  }
});

module.exports = router;
