// 应用配置文件
const CONFIG = {
    // 应用基本信息
    app: {
        name: '随息居 · 智能食疗检索平台',
        version: '2.0.0',
        description: '基于中医药食疗理论的智能检索平台',
        author: '随息居团队'
    },

    // 数据源配置
    dataSources: {
        ingredients: 'ingredients_master.csv',
        recipes: 'recipes_master.csv',
        recipeIngredients: 'recipe_ingredients_restructured.csv',
        // 扩展数据源（未来使用）
        herbs: null,
        conditions: null,
        encyclopedia: null
    },

    // 搜索引擎配置
    search: {
        // Fuse.js 配置
        fuse: {
            threshold: 0.4,        // 模糊匹配阈值
            distance: 100,         // 匹配距离
            minMatchCharLength: 2,  // 最小匹配长度
            includeScore: true,     // 包含评分
            includeMatches: true,   // 包含匹配信息
            ignoreLocation: true,   // 忽略位置
            keys: [
                { name: 'name_zh', weight: 0.3 },
                { name: 'primary_functions', weight: 0.2 },
                { name: 'indications', weight: 0.2 },
                { name: 'constitutions_suitable', weight: 0.15 },
                { name: 'intent_tags', weight: 0.15 }
            ]
        },
        
        // 分页配置
        pagination: {
            defaultPageSize: 20,
            pageSizeOptions: [10, 20, 50, 100],
            maxPages: 50
        },

        // 排序选项
        sortOptions: [
            { value: 'relevance', label: '相关性排序', field: null },
            { value: 'name', label: '名称排序', field: 'name_zh' },
            { value: 'category', label: '分类排序', field: 'gate_category' },
            { value: 'qi', label: '四气排序', field: 'four_qi' },
            { value: 'flavor', label: '五味排序', field: 'five_flavors' }
        ]
    },

    // UI 配置
    ui: {
        // 主题配置
        themes: {
            light: {
                name: '浅色主题',
                icon: 'fa-sun'
            },
            dark: {
                name: '深色主题',
                icon: 'fa-moon'
            }
        },

        // 视图模式
        viewModes: {
            grid: {
                name: '网格视图',
                icon: 'fa-th',
                columns: 'repeat(auto-fill, minmax(320px, 1fr))'
            },
            list: {
                name: '列表视图',
                icon: 'fa-list',
                columns: '1fr'
            }
        },

        // 动画配置
        animations: {
            duration: {
                fast: 150,
                normal: 300,
                slow: 500
            },
            easing: 'ease'
        },

        // 加载状态
        loading: {
            minDuration: 500,  // 最小加载时间（防止闪烁）
            timeout: 10000     // 加载超时时间
        }
    },

    // 数据处理配置
    dataProcessing: {
        // 缓存配置
        cache: {
            enabled: true,
            expiration: 24 * 60 * 60 * 1000, // 24小时
            prefix: 'suixiju_'
        },

        // 数据验证规则
        validation: {
            required: ['name_zh'],
            numeric: ['dosage_note'],
            enum: {
                four_qi: ['寒', '凉', '平', '温', '热'],
                five_flavors: ['酸', '甜', '苦', '辛', '咸'],
                seasonality: ['春', '夏', '秋', '冬', '四季']
            }
        },

        // 数据转换配置
        transforms: {
            // 体质标签标准化
            constitutionMapping: {
                '气虚质': '气虚',
                '阳虚质': '阳虚',
                '阴虚质': '阴虚',
                '痰湿质': '痰湿',
                '湿热质': '湿热',
                '血虚质': '血虚',
                '气郁质': '气郁',
                '血瘀质': '血瘀',
                '平和质': '平和'
            }
        }
    },

    // 本地存储配置
    storage: {
        // LocalStorage 键名
        keys: {
            theme: 'suixiju_theme',
            favorites: 'suixiju_favorites',
            searchHistory: 'suixiju_search_history',
            userPreferences: 'suixiju_preferences'
        },

        // 数据限制
        limits: {
            maxFavorites: 500,
            maxSearchHistory: 100,
            maxCacheSize: 50 * 1024 * 1024 // 50MB
        }
    },

    // 功能开关
    features: {
        favorites: true,           // 收藏功能
        searchHistory: true,       // 搜索历史
        dataExport: true,         // 数据导出
        sharing: true,            // 分享功能
        statistics: true,         // 统计分析
        notifications: true,      // 通知提醒
        offlineMode: false,       // 离线模式（未来功能）
        userAccounts: false       // 用户账户系统（未来功能）
    },

    // API 配置（扩展功能）
    api: {
        baseUrl: null,            // API 基础URL
        timeout: 10000,           // 请求超时时间
        retryAttempts: 3,         // 重试次数
        endpoints: {
            // 未来可能的API端点
            search: '/api/search',
            ingredients: '/api/ingredients',
            recipes: '/api/recipes',
            favorites: '/api/favorites',
            analytics: '/api/analytics'
        }
    },

    // 分析统计配置
    analytics: {
        // 图表配置
        charts: {
            colors: [
                '#2563eb', '#10b981', '#f59e0b', '#ef4444', 
                '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
            ],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        },

        // 统计维度
        dimensions: {
            categories: '食材分类',
            qi: '四气分布',
            flavors: '五味分布',
            constitutions: '体质适配',
            seasons: '季节分布',
            meridians: '归经分布'
        }
    },

    // 导出配置
    export: {
        formats: {
            csv: {
                name: 'CSV 格式',
                extension: '.csv',
                mimeType: 'text/csv'
            },
            json: {
                name: 'JSON 格式',
                extension: '.json',
                mimeType: 'application/json'
            },
            excel: {
                name: 'Excel 格式',
                extension: '.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        },

        // 导出选项
        options: {
            includeHeaders: true,
            encoding: 'utf-8',
            maxRecords: 10000
        }
    },

    // 错误处理配置
    errorHandling: {
        // 错误级别
        levels: {
            info: 'info',
            warning: 'warning',
            error: 'error',
            critical: 'critical'
        },

        // 错误消息
        messages: {
            networkError: '网络连接失败，请检查网络设置',
            dataLoadError: '数据加载失败，请刷新页面重试',
            parseError: '数据解析失败，请检查数据格式',
            searchError: '搜索功能暂时不可用，请稍后重试',
            storageError: '本地存储功能不可用，部分功能可能受限'
        },

        // 重试配置
        retry: {
            maxAttempts: 3,
            delay: 1000,
            backoff: 2
        }
    },

    // 性能配置
    performance: {
        // 虚拟滚动
        virtualScroll: {
            enabled: false,        // 数据量大时启用
            itemHeight: 200,       // 单项高度
            buffer: 10             // 缓冲区大小
        },

        // 防抖延迟
        debounce: {
            search: 300,           // 搜索防抖
            resize: 100,           // 窗口调整防抖
            scroll: 50             // 滚动防抖
        },

        // 懒加载
        lazyLoad: {
            images: true,          // 图片懒加载
            threshold: 0.1,        // 触发阈值
            rootMargin: '50px'     // 根边距
        }
    },

    // 开发模式配置
    development: {
        debug: false,             // 调试模式
        mockData: false,          // 使用模拟数据
        logLevel: 'info',         // 日志级别
        showPerformance: false,   // 显示性能指标
        enableTestFeatures: false // 启用测试功能
    }
};

// 根据环境调整配置
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.development.debug = true;
    CONFIG.development.showPerformance = true;
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}