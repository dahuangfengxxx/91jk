/**
 * 工具函数库
 * 提供通用的工具函数和辅助方法
 */

const Utils = {
    /**
     * 防抖函数
     * @param {Function} func 要防抖的函数
     * @param {number} wait 等待时间
     * @param {boolean} immediate 是否立即执行
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    /**
     * 节流函数
     * @param {Function} func 要节流的函数
     * @param {number} limit 时间限制
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 深度克隆对象
     * @param {any} obj 要克隆的对象
     * @returns {any} 克隆后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    /**
     * 数组去重
     * @param {Array} array 要去重的数组
     * @param {string} key 对象数组的去重键
     * @returns {Array} 去重后的数组
     */
    unique(array, key = null) {
        if (!Array.isArray(array)) return [];
        
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        }
        
        return [...new Set(array)];
    },

    /**
     * 安全获取对象属性
     * @param {Object} obj 对象
     * @param {string} path 属性路径，如 'a.b.c'
     * @param {any} defaultValue 默认值
     * @returns {any} 属性值或默认值
     */
    get(obj, path, defaultValue = undefined) {
        if (!obj || typeof obj !== 'object') return defaultValue;
        
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result == null || typeof result !== 'object') {
                return defaultValue;
            }
            result = result[key];
        }
        
        return result !== undefined ? result : defaultValue;
    },

    /**
     * 字符串包含检查（忽略大小写）
     * @param {string} text 源字符串
     * @param {string} search 搜索字符串
     * @returns {boolean} 是否包含
     */
    includesIgnoreCase(text, search) {
        if (!text || !search) return false;
        return text.toLowerCase().includes(search.toLowerCase());
    },

    /**
     * 格式化文件大小
     * @param {number} bytes 字节数
     * @param {number} decimals 小数位数
     * @returns {string} 格式化后的大小
     */
    formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * 格式化日期
     * @param {Date|string|number} date 日期
     * @param {string} format 格式字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 生成UUID
     * @returns {string} UUID字符串
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * 本地存储封装
     */
    storage: {
        /**
         * 设置本地存储
         * @param {string} key 键
         * @param {any} value 值
         * @param {number} expiration 过期时间（毫秒）
         */
        set(key, value, expiration = null) {
            try {
                const item = {
                    value: value,
                    timestamp: Date.now(),
                    expiration: expiration
                };
                localStorage.setItem(key, JSON.stringify(item));
            } catch (error) {
                console.warn('LocalStorage write failed:', error);
            }
        },

        /**
         * 获取本地存储
         * @param {string} key 键
         * @param {any} defaultValue 默认值
         * @returns {any} 存储的值或默认值
         */
        get(key, defaultValue = null) {
            try {
                const itemStr = localStorage.getItem(key);
                if (!itemStr) return defaultValue;
                
                const item = JSON.parse(itemStr);
                
                // 检查是否过期
                if (item.expiration && Date.now() > item.timestamp + item.expiration) {
                    localStorage.removeItem(key);
                    return defaultValue;
                }
                
                return item.value;
            } catch (error) {
                console.warn('LocalStorage read failed:', error);
                return defaultValue;
            }
        },

        /**
         * 删除本地存储
         * @param {string} key 键
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn('LocalStorage remove failed:', error);
            }
        },

        /**
         * 清空本地存储
         */
        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                console.warn('LocalStorage clear failed:', error);
            }
        }
    },

    /**
     * DOM 操作工具
     */
    dom: {
        /**
         * 查询元素
         * @param {string} selector 选择器
         * @param {Element} parent 父元素
         * @returns {Element|null} 元素
         */
        $(selector, parent = document) {
            return parent.querySelector(selector);
        },

        /**
         * 查询所有元素
         * @param {string} selector 选择器
         * @param {Element} parent 父元素
         * @returns {NodeList} 元素列表
         */
        $$(selector, parent = document) {
            return parent.querySelectorAll(selector);
        },

        /**
         * 创建元素
         * @param {string} tagName 标签名
         * @param {Object} attributes 属性对象
         * @param {string} textContent 文本内容
         * @returns {Element} 创建的元素
         */
        create(tagName, attributes = {}, textContent = '') {
            const element = document.createElement(tagName);
            
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'dataset') {
                    Object.keys(attributes[key]).forEach(dataKey => {
                        element.dataset[dataKey] = attributes[key][dataKey];
                    });
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });
            
            if (textContent) {
                element.textContent = textContent;
            }
            
            return element;
        },

        /**
         * 添加事件监听器
         * @param {Element|string} element 元素或选择器
         * @param {string} event 事件类型
         * @param {Function} handler 事件处理函数
         * @param {boolean|Object} options 选项
         */
        on(element, event, handler, options = false) {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) {
                el.addEventListener(event, handler, options);
            }
        },

        /**
         * 移除事件监听器
         * @param {Element|string} element 元素或选择器
         * @param {string} event 事件类型
         * @param {Function} handler 事件处理函数
         */
        off(element, event, handler) {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) {
                el.removeEventListener(event, handler);
            }
        },

        /**
         * 切换类名
         * @param {Element|string} element 元素或选择器
         * @param {string} className 类名
         * @param {boolean} force 强制添加或移除
         */
        toggleClass(element, className, force = undefined) {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) {
                el.classList.toggle(className, force);
            }
        },

        /**
         * 检查元素是否可见
         * @param {Element} element 元素
         * @returns {boolean} 是否可见
         */
        isVisible(element) {
            return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
        }
    },

    /**
     * 数据验证工具
     */
    validate: {
        /**
         * 检查是否为空
         * @param {any} value 值
         * @returns {boolean} 是否为空
         */
        isEmpty(value) {
            if (value == null) return true;
            if (typeof value === 'string') return value.trim() === '';
            if (Array.isArray(value)) return value.length === 0;
            if (typeof value === 'object') return Object.keys(value).length === 0;
            return false;
        },

        /**
         * 检查是否为数字
         * @param {any} value 值
         * @returns {boolean} 是否为数字
         */
        isNumber(value) {
            return !isNaN(parseFloat(value)) && isFinite(value);
        },

        /**
         * 检查是否为邮箱
         * @param {string} email 邮箱地址
         * @returns {boolean} 是否为有效邮箱
         */
        isEmail(email) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },

        /**
         * 检查字符串长度
         * @param {string} str 字符串
         * @param {number} min 最小长度
         * @param {number} max 最大长度
         * @returns {boolean} 长度是否在范围内
         */
        lengthInRange(str, min, max) {
            if (typeof str !== 'string') return false;
            const len = str.length;
            return len >= min && len <= max;
        }
    },

    /**
     * 数学工具
     */
    math: {
        /**
         * 生成指定范围的随机整数
         * @param {number} min 最小值
         * @param {number} max 最大值
         * @returns {number} 随机整数
         */
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * 将数值限制在指定范围内
         * @param {number} value 值
         * @param {number} min 最小值
         * @param {number} max 最大值
         * @returns {number} 限制后的值
         */
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        /**
         * 计算数组平均值
         * @param {number[]} numbers 数字数组
         * @returns {number} 平均值
         */
        average(numbers) {
            if (!Array.isArray(numbers) || numbers.length === 0) return 0;
            const sum = numbers.reduce((acc, num) => acc + num, 0);
            return sum / numbers.length;
        },

        /**
         * 计算百分比
         * @param {number} value 值
         * @param {number} total 总数
         * @param {number} decimals 小数位数
         * @returns {number} 百分比
         */
        percentage(value, total, decimals = 2) {
            if (total === 0) return 0;
            return Number(((value / total) * 100).toFixed(decimals));
        }
    },

    /**
     * 颜色工具
     */
    color: {
        /**
         * 十六进制转RGB
         * @param {string} hex 十六进制颜色
         * @returns {Object} RGB对象
         */
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        /**
         * RGB转十六进制
         * @param {number} r 红色分量
         * @param {number} g 绿色分量
         * @param {number} b 蓝色分量
         * @returns {string} 十六进制颜色
         */
        rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },

        /**
         * 生成随机颜色
         * @returns {string} 随机十六进制颜色
         */
        random() {
            return '#' + Math.floor(Math.random() * 16777215).toString(16);
        }
    },

    /**
     * 性能监控工具
     */
    performance: {
        timers: new Map(),

        /**
         * 开始计时
         * @param {string} name 计时器名称
         */
        start(name) {
            this.timers.set(name, performance.now());
        },

        /**
         * 结束计时
         * @param {string} name 计时器名称
         * @returns {number} 耗时（毫秒）
         */
        end(name) {
            const startTime = this.timers.get(name);
            if (startTime) {
                const duration = performance.now() - startTime;
                this.timers.delete(name);
                return duration;
            }
            return 0;
        },

        /**
         * 测量函数执行时间
         * @param {Function} func 函数
         * @param {string} name 名称
         * @returns {any} 函数返回值
         */
        measure(func, name = 'anonymous') {
            this.start(name);
            const result = func();
            const duration = this.end(name);
            if (CONFIG.development.showPerformance) {
                console.log(`${name} executed in ${duration.toFixed(2)}ms`);
            }
            return result;
        }
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}