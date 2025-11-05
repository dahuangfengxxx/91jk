# 🔒 91jk 网站安全部署指南

## 问题概述
原始的CSV数据文件直接暴露在网站根目录，可被下载工具如IDM自动发现和下载，造成核心数据泄露风险。

## 🛡️ 安全解决方案

### 1. 数据保护策略
- ✅ 将CSV文件转换为混淆的JSON格式
- ✅ 实施客户端数据解密
- ✅ 添加数据完整性校验
- ✅ 实施访问频率限制

### 2. 服务器级别保护
- ✅ Netlify重定向规则阻止CSV文件访问
- ✅ HTTP安全头部配置
- ✅ 内容安全策略(CSP)
- ✅ 防爬虫robots.txt配置

### 3. 客户端安全
- ✅ 域名白名单验证
- ✅ 可疑活动监控
- ✅ 开发者工具检测
- ✅ API请求频率控制

## 🚀 部署步骤

### 步骤1: 更新GitHub仓库
```bash
# 1. 提交新的安全配置
git add .
git commit -m "🔒 实施数据安全保护措施"
git push origin main
```

### 步骤2: 配置Netlify设置
1. 登录Netlify控制台
2. 进入91jk项目设置
3. 在 **Build & deploy** > **Environment variables** 中添加：
   ```
   SITE_SECURITY_KEY=your-random-secret-key-here
   ALLOWED_DOMAINS=91jk.liyang2002.com,localhost
   ```

### 步骤3: 验证安全配置
部署后测试以下URL应该返回404：
- `https://91jk.liyang2002.com/ingredients_master.csv`
- `https://91jk.liyang2002.com/recipes_master.csv`
- `https://91jk.liyang2002.com/recipe_ingredients_restructured.csv`

### 步骤4: 测试数据加载
访问主页面，确认：
- ✅ 数据正常加载显示
- ✅ 搜索功能正常工作
- ✅ 详情页面正常显示

## 🔍 安全特性详解

### 数据混淆保护
```javascript
// CSV数据被转换为base64编码的JSON
{
    "timestamp": 1699123456789,
    "checksum": "a1b2c3d4",
    "data": "eyJuYW1lX3poIjoi..."  // base64编码的原始数据
}
```

### 访问控制机制
1. **域名白名单**: 只允许授权域名访问
2. **频率限制**: 每小时最多100次API请求
3. **Referer检查**: 验证请求来源
4. **数据完整性**: 校验和验证防篡改

### Netlify重定向规则
```toml
# 阻止CSV文件访问
[[redirects]]
  from = "/*.csv"
  to = "/404.html"
  status = 404
  force = true
```

## 🚨 应急处理

### 如果发现数据泄露
1. 立即更新安全密钥
2. 分析访问日志
3. 考虑更换数据编码方式
4. 增强访问控制策略

### 监控指标
- API请求频率
- 404错误数量
- 可疑IP访问
- 开发者工具检测数量

## 📈 进一步增强建议

### 短期(1-2周)
- [ ] 实施JWT token认证
- [ ] 添加用户行为分析
- [ ] 设置更严格的CSP策略

### 中期(1个月)
- [ ] 考虑服务端API实现
- [ ] 添加用户注册/登录系统
- [ ] 实施更复杂的数据加密

### 长期(3个月)
- [ ] 迁移到专业云服务
- [ ] 实施数据库后端
- [ ] 添加付费订阅模式

## 🛠️ 维护清单

### 每周检查
- [ ] 查看Netlify访问日志
- [ ] 检查404错误报告
- [ ] 验证安全规则有效性

### 每月检查
- [ ] 更新安全密钥
- [ ] 审查访问模式
- [ ] 测试所有安全功能

## 📞 技术支持

如果遇到问题，请检查：
1. 浏览器控制台错误
2. Netlify部署日志
3. 网络请求状态
4. 安全脚本加载情况

---

**重要提醒**: 
- 定期备份数据
- 监控异常访问
- 保持安全配置更新
- 测试所有功能正常运行