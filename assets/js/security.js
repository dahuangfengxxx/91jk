/**
 * 客户端安全验证模块
 */

class SecurityGuard {
    constructor() {
        this.allowedDomains = [
            '91jk.liyang2002.com',
            'localhost',
            '127.0.0.1'
        ];
        this.suspiciousPatterns = [
            /\.csv$/i,
            /\.py$/i,
            /__pycache__/i,
            /scripts\//i,
            /download/i,
            /wget/i,
            /curl/i
        ];
        this.initSecurityChecks();
    }

    /**
     * 初始化安全检查
     */
    initSecurityChecks() {
        this.checkDomain();
        this.preventDirectAccess();
        this.monitorSuspiciousActivity();
        this.setupCSP();
    }

    /**
     * 检查域名合法性
     */
    checkDomain() {
        if (typeof window === 'undefined') return true;
        
        const hostname = window.location.hostname;
        console.log('🔍 检查域名:', hostname);
        
        const isAllowed = this.allowedDomains.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
        ) || hostname.endsWith('.netlify.app') || hostname === '' || hostname.includes('127.0.0.1');
        
        if (!isAllowed) {
            console.warn('🚨 未授权的域名访问:', hostname);
            // 暂时注释掉安全警告，便于本地调试
            // this.showSecurityWarning();
            return false;
        }
        
        console.log('✅ 域名验证通过:', hostname);
        return true;
    }

    /**
     * 防止直接访问敏感文件
     */
    preventDirectAccess() {
        if (typeof window === 'undefined') return;
        
        const pathname = window.location.pathname;
        const isSuspicious = this.suspiciousPatterns.some(pattern => 
            pattern.test(pathname)
        );
        
        if (isSuspicious) {
            console.warn('🚨 检测到可疑文件访问:', pathname);
            window.location.href = '/404.html';
            return;
        }
    }

    /**
     * 监控可疑活动
     */
    monitorSuspiciousActivity() {
        if (typeof window === 'undefined') return;
        
        // 监控开发者工具
        let devtools = {open: false, orientation: null};
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.warn('🔍 检测到开发者工具已打开');
                }
            } else {
                devtools.open = false;
            }
        }, 500);

        // 监控控制台命令
        const originalLog = console.log;
        console.log = function(...args) {
            const message = args.join(' ');
            if (message.includes('csv') || message.includes('download')) {
                console.warn('🚨 可疑控制台活动');
            }
            originalLog.apply(console, args);
        };
    }

    /**
     * 设置内容安全策略
     */
    setupCSP() {
        if (typeof document === 'undefined') return;
        
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
                      "img-src 'self' data: https:; " +
                      "connect-src 'self' https:; " +
                      "font-src 'self' https: data:; " +
                      "object-src 'none'; " +
                      "base-uri 'self';";
        
        document.head.appendChild(meta);
    }

    /**
     * 显示安全警告
     */
    showSecurityWarning() {
        if (typeof document === 'undefined') return;
        
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            ">
                <div style="text-align: center; padding: 2rem;">
                    <h1 style="color: #ff4444; margin-bottom: 1rem;">🚨 安全警告</h1>
                    <p style="margin-bottom: 2rem;">检测到未授权访问，即将重定向...</p>
                    <div style="font-size: 2rem;">⚠️</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            window.location.href = 'https://91jk.liyang2002.com';
        }, 3000);
    }

    /**
     * 验证API请求
     */
    validateAPIRequest(url) {
        // 检查请求频率
        const now = Date.now();
        const requests = JSON.parse(localStorage.getItem('api_requests') || '[]');
        const recentRequests = requests.filter(time => now - time < 60000); // 1分钟内
        
        if (recentRequests.length > 50) {
            throw new Error('请求过于频繁，请稍后再试');
        }
        
        // 记录请求
        recentRequests.push(now);
        localStorage.setItem('api_requests', JSON.stringify(recentRequests.slice(-50)));
        
        return true;
    }

    /**
     * 生成安全令牌
     */
    generateSecurityToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const domain = window.location.hostname;
        
        return btoa(`${timestamp}:${random}:${domain}`);
    }
}

// 立即执行安全检查
const securityGuard = new SecurityGuard();

// 导出到全局
if (typeof window !== 'undefined') {
    window.SecurityGuard = SecurityGuard;
    window.securityGuard = securityGuard;
}

// Node.js导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityGuard;
}