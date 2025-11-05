/**
 * 安全数据管理器 - 使用加密的JSON数据
 */

class SecureDataManager {
    constructor() {
        this.ingredients = [];
        this.recipes = [];
        this.recipeIngredients = [];
        this.isLoaded = false;
        this.apiConfig = null;
        
        // 访问控制
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.maxRequestsPerHour = 100;
        
        // 数据统计
        this.stats = {
            totalIngredients: 0,
            totalRecipes: 0,
            totalCategories: 0,
            categories: {},
            constitutions: {},
            seasons: {},
            qi: {},
            flavors: {}
        };
    }

    /**
     * 检查访问频率限制
     */
    checkRateLimit() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        // 重置计数器（每小时）
        if (now - this.lastRequestTime > oneHour) {
            this.requestCount = 0;
            this.lastRequestTime = now;
        }
        
        if (this.requestCount >= this.maxRequestsPerHour) {
            throw new Error('访问频率过高，请稍后再试');
        }
        
        this.requestCount++;
        return true;
    }

    /**
     * 验证请求来源
     */
    validateReferer() {
        if (typeof window !== 'undefined' && window.location) {
            const allowedDomains = [
                '91jk.liyang2002.com',
                'localhost',
                '127.0.0.1',
                'netlify.app'
            ];
            
            const hostname = window.location.hostname;
            console.log('🔍 验证请求来源:', hostname);
            
            const isAllowed = allowedDomains.some(domain => 
                hostname === domain || hostname.endsWith('.' + domain)
            ) || hostname === '' || hostname.includes('127.0.0.1');
            
            if (!isAllowed) {
                console.warn('Unauthorized domain access attempt:', hostname);
                return false;
            }
            
            console.log('✅ 请求来源验证通过');
        }
        return true;
    }

    /**
     * 反混淆数据
     */
    deobfuscate(str) {
        try {
            return atob(str);
        } catch (e) {
            throw new Error('数据解析失败');
        }
    }

    /**
     * 验证数据完整性
     */
    validateChecksum(data, expectedChecksum) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const calculatedChecksum = Math.abs(hash).toString(16);
        return calculatedChecksum === expectedChecksum;
    }

    /**
     * 安全加载JSON数据
     */
    async loadSecureJSON(url) {
        try {
            // 检查访问控制
            this.checkRateLimit();
            
            if (!this.validateReferer()) {
                throw new Error('访问被拒绝');
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                cache: 'default'
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const encryptedData = await response.json();
            
            // 解密和验证数据
            const jsonStr = this.deobfuscate(encryptedData.data);
            const data = JSON.parse(jsonStr);
            
            // 验证校验和
            if (!this.validateChecksum(data, encryptedData.checksum)) {
                console.warn('数据完整性校验失败');
            }

            return data;
            
        } catch (error) {
            console.error(`加载数据失败 (${url}):`, error.message);
            throw error;
        }
    }

    /**
     * 初始化数据加载
     */
    async initialize() {
        try {
            console.log('正在初始化安全数据管理器...');
            this.showLoading(true);
            
            // 首先加载API配置
            try {
                const configResponse = await fetch('/data/api-config.json');
                this.apiConfig = await configResponse.json();
                console.log('API配置加载成功');
            } catch (e) {
                console.warn('API配置加载失败，使用默认配置');
            }
            
            // 并行加载所有数据
            console.log('正在加载核心数据...');
            const [ingredientsData, recipesData, recipeIngredientsData] = await Promise.all([
                this.loadSecureJSON('/data/ingredients.json'),
                this.loadSecureJSON('/data/recipes.json'),
                this.loadSecureJSON('/data/recipe_ingredients.json')
            ]);

            // 处理数据
            this.ingredients = this.processIngredientsData(ingredientsData);
            this.recipes = this.processRecipesData(recipesData);
            this.recipeIngredients = this.processRecipeIngredientsData(recipeIngredientsData);

            console.log(`✅ 成功加载: ${this.ingredients.length} 种食材, ${this.recipes.length} 个配方`);

            // 构建统计信息
            this.buildStats();
            
            this.isLoaded = true;
            this.showLoading(false);
            
            // 触发数据加载完成事件
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('dataLoaded', { detail: this }));
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ 数据初始化失败:', error);
            this.showLoading(false);
            this.showError('数据加载失败，请刷新页面重试');
            return false;
        }
    }

    /**
     * 处理食材数据
     */
    processIngredientsData(data) {
        return data.map(item => ({
            name_zh: item.name_zh || '',
            name_pinyin: item.name_pinyin || '',
            gate_category: item.gate_category || '',
            subcategory: item.subcategory || '',
            four_qi: item.four_qi || '',
            five_flavors: item.five_flavors || '',
            meridians: item.meridians || '',
            primary_functions: item.primary_functions || '',
            indications: item.indications || '',
            constitutions_suitable: item.constitutions_suitable || '',
            constitutions_caution: item.constitutions_caution || '',
            contraindications: item.contraindications || '',
            seasonality: item.seasonality || '',
            prep_methods: item.prep_methods || '',
            pairing_good: item.pairing_good || '',
            pairing_bad: item.pairing_bad || '',
            dietary_dosage: item.dietary_dosage || '',
            medicinal_dosage: item.medicinal_dosage || '',
            modern_notes: item.modern_notes || '',
            source_ref: item.source_ref || ''
        }));
    }

    /**
     * 处理配方数据
     */
    processRecipesData(data) {
        return data.map(item => ({
            title_zh: item.title_zh || '',
            intent_tags: item.intent_tags || '',
            constitution_tags: item.constitution_tags || '',
            method: item.method || '',
            usage: item.usage || '',
            cautions: item.cautions || '',
            seasonality: item.seasonality || ''
        }));
    }

    /**
     * 处理配方食材关联数据
     */
    processRecipeIngredientsData(data) {
        return data.map(item => ({
            recipe_title: item.recipe_title || '',
            ingredient_count: parseInt(item.ingredient_count) || 0,
            ingredient_name_zh: item.ingredient_name_zh || '',
            amount: item.amount || '',
            note: item.note || ''
        }));
    }

    /**
     * 构建统计信息
     */
    buildStats() {
        this.stats.totalIngredients = this.ingredients.length;
        this.stats.totalRecipes = this.recipes.length;
        
        // 分类统计
        const categories = new Set();
        const constitutions = new Set();
        const seasons = new Set();
        const qiTypes = new Set();
        const flavors = new Set();
        
        this.ingredients.forEach(item => {
            if (item.gate_category) categories.add(item.gate_category);
            if (item.constitutions_suitable) {
                item.constitutions_suitable.split(',').forEach(c => constitutions.add(c.trim()));
            }
            if (item.seasonality) seasons.add(item.seasonality);
            if (item.four_qi) qiTypes.add(item.four_qi);
            if (item.five_flavors) flavors.add(item.five_flavors);
        });
        
        this.stats.totalCategories = categories.size;
        this.stats.categories = Array.from(categories);
        this.stats.constitutions = Array.from(constitutions);
        this.stats.seasons = Array.from(seasons);
        this.stats.qi = Array.from(qiTypes);
        this.stats.flavors = Array.from(flavors);
    }

    /**
     * 搜索功能
     */
    search(query, filters = {}) {
        if (!this.isLoaded) {
            console.warn('数据尚未加载完成');
            return [];
        }

        let results = [...this.ingredients];
        
        // 应用搜索查询
        if (query) {
            const searchTerm = query.toLowerCase();
            results = results.filter(item => 
                item.name_zh.toLowerCase().includes(searchTerm) ||
                item.primary_functions.toLowerCase().includes(searchTerm) ||
                item.indications.toLowerCase().includes(searchTerm) ||
                item.gate_category.toLowerCase().includes(searchTerm)
            );
        }
        
        // 应用过滤器
        if (filters.constitution) {
            results = results.filter(item => 
                item.constitutions_suitable && item.constitutions_suitable.includes(filters.constitution)
            );
        }
        
        if (filters.season) {
            results = results.filter(item => 
                item.seasonality && item.seasonality.includes(filters.season)
            );
        }
        
        if (filters.qi) {
            results = results.filter(item => 
                item.four_qi && item.four_qi.includes(filters.qi)
            );
        }
        
        return results;
    }

    /**
     * 获取配方的食材列表
     */
    getRecipeIngredients(recipeName) {
        return this.recipeIngredients.filter(item => item.recipe_title === recipeName);
    }

    /**
     * 获取食材相关的配方
     */
    getIngredientRecipes(ingredientName) {
        const relatedRecipeNames = this.recipeIngredients
            .filter(item => item.ingredient_name_zh === ingredientName)
            .map(item => item.recipe_title);
        
        return this.recipes.filter(recipe => 
            relatedRecipeNames.includes(recipe.title_zh)
        );
    }

    /**
     * 获取唯一的体质类型
     */
    getUniqueConstitutions() {
        return this.stats.constitutions.filter(Boolean);
    }

    /**
     * 获取唯一的分类
     */
    getUniqueCategories() {
        return this.stats.categories.filter(Boolean);
    }

    /**
     * 显示加载状态
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        console.error('数据管理器错误:', message);
        // 可以在这里添加用户友好的错误显示
    }
}

// 创建全局实例
const secureDataManager = new SecureDataManager();

// 兼容性：保持原有的dataManager名称
const dataManager = secureDataManager;

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureDataManager;
} else {
    window.SecureDataManager = SecureDataManager;
    window.dataManager = dataManager;
    window.secureDataManager = secureDataManager;
}