/**
 * 数据管理器
 * 负责数据的加载、处理、缓存和管理
 */

class DataManager {
    constructor() {
        this.ingredients = [];
        this.recipes = [];
        this.recipeIngredients = [];
        this.isLoaded = false;
        this.cache = new Map();
        
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
     * 初始化数据加载
     * @returns {Promise<boolean>} 加载结果
     */
    async initialize() {
        try {
            console.log('Starting data initialization...');
            Utils.performance.start('dataLoading');
            
            // 显示加载动画
            this.showLoading(true);
            
            // 检查是否需要使用HTTP服务器
            if (window.location.protocol === 'file:') {
                console.warn('Running from file:// protocol. Some features may not work correctly.');
                this.showFileProtocolWarning();
            }
            
            // 并行加载所有CSV文件
            console.log('Loading CSV files...');
            const [ingredientsData, recipesData, recipeIngredientsData] = await Promise.all([
                this.loadCSV(CONFIG.dataSources.ingredients),
                this.loadCSV(CONFIG.dataSources.recipes),
                this.loadCSV(CONFIG.dataSources.recipeIngredients)
            ]);

            console.log('Processing data...');
            // 数据处理和验证
            this.ingredients = this.processIngredients(ingredientsData);
            this.recipes = this.processRecipes(recipesData);
            this.recipeIngredients = this.processRecipeIngredients(recipeIngredientsData);

            console.log(`Processed ${this.ingredients.length} ingredients, ${this.recipes.length} recipes`);

            // 构建统计信息
            this.buildStatistics();

            // 建立数据索引
            this.buildIndexes();

            this.isLoaded = true;
            
            const loadTime = Utils.performance.end('dataLoading');
            console.log(`Data loaded successfully in ${loadTime.toFixed(2)}ms`);

            // 隐藏加载动画
            this.showLoading(false);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize data:', error);
            this.showLoading(false);
            this.showErrorMessage(error);
            return false;
        }
    }

    /**
     * 显示文件协议警告
     */
    showFileProtocolWarning() {
        const warningHtml = `
            <div class="protocol-warning" style="background: #fff3cd; border: 1px solid #ffecb3; padding: 1rem; margin: 1rem; border-radius: 8px;">
                <h4 style="color: #856404; margin: 0 0 0.5rem 0;">⚠️ 运行环境提示</h4>
                <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                    当前正在使用 file:// 协议直接打开文件。为了获得最佳体验，请：
                </p>
                <ol style="color: #856404; margin: 0.5rem 0 0 1rem; font-size: 0.9rem;">
                    <li>启动本地HTTP服务器（如: python -m http.server 8000）</li>
                    <li>或者将文件部署到Web服务器</li>
                </ol>
            </div>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', warningHtml);
        }
    }

    /**
     * 显示错误消息
     */
    showErrorMessage(error) {
        const errorHtml = `
            <div class="error-message" style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 1rem; margin: 1rem; border-radius: 8px; text-align: center;">
                <h3 style="color: #721c24; margin: 0 0 1rem 0;">🚨 数据加载失败</h3>
                <p style="color: #721c24; margin: 0 0 1rem 0;">
                    无法加载数据文件。请检查：
                </p>
                <ul style="color: #721c24; text-align: left; margin: 0 0 1rem 0; display: inline-block;">
                    <li>确保所有CSV文件都在正确位置</li>
                    <li>使用HTTP/HTTPS协议访问（不是file://）</li>
                    <li>检查网络连接</li>
                    <li>查看浏览器控制台获取详细错误信息</li>
                </ul>
                <button onclick="window.location.reload()" style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                    重新加载
                </button>
            </div>
        `;
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = errorHtml;
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * 加载CSV文件
     * @param {string} filename 文件名
     * @returns {Promise<Array>} 解析后的数据
     */
    async loadCSV(filename) {
        // 检查缓存
        const cacheKey = `csv_${filename}`;
        if (CONFIG.dataProcessing.cache.enabled) {
            const cached = Utils.storage.get(cacheKey);
            if (cached) {
                console.log(`Using cached data for ${filename}`);
                return cached;
            }
        }

        try {
            console.log(`Loading CSV file: ${filename}`);
            const response = await fetch(filename);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for file: ${filename}`);
            }
            
            const csvText = await response.text();
            console.log(`CSV file loaded, size: ${csvText.length} characters`);
            
            const parsed = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(),
                transform: (value) => value ? value.trim() : ''
            });

            if (parsed.errors.length > 0) {
                console.warn(`CSV parsing warnings for ${filename}:`, parsed.errors);
            }

            const data = parsed.data.filter(row => {
                // 过滤掉空行
                return Object.values(row).some(value => value && value.trim());
            });

            console.log(`Parsed ${data.length} records from ${filename}`);

            // 缓存数据
            if (CONFIG.dataProcessing.cache.enabled) {
                Utils.storage.set(cacheKey, data, CONFIG.dataProcessing.cache.expiration);
            }

            return data;
        } catch (error) {
            console.error(`Failed to load ${filename}:`, error);
            // 返回示例数据作为降级方案
            return this.getFallbackData(filename);
        }
    }

    /**
     * 获取降级数据
     */
    getFallbackData(filename) {
        console.log(`Using fallback data for ${filename}`);
        
        if (filename.includes('ingredients')) {
            return [
                {
                    name_zh: '大米',
                    gate_category: '谷食',
                    subcategory: '谷',
                    four_qi: '平',
                    five_flavors: '甘',
                    meridians: '脾,胃',
                    primary_functions: '健脾益气,和中',
                    indications: '纳差,乏力',
                    constitutions_suitable: '气虚,脾虚',
                    seasonality: '四季',
                    dosage_note: '30-60g/次',
                    modern_notes: '复合碳水/纤维'
                },
                {
                    name_zh: '小米',
                    gate_category: '谷食',
                    subcategory: '谷',
                    four_qi: '平',
                    five_flavors: '甘',
                    meridians: '脾,胃',
                    primary_functions: '健脾益气,和中',
                    indications: '纳差,乏力',
                    constitutions_suitable: '气虚,脾虚',
                    seasonality: '四季',
                    dosage_note: '30-60g/次',
                    modern_notes: '复合碳水/纤维'
                }
            ];
        } else if (filename.includes('recipes')) {
            return [
                {
                    title_zh: '小米粥',
                    intent_tags: '健脾养胃,益气',
                    constitution_tags: '气虚,脾虚',
                    method: '小火煮至稠',
                    usage: '每日早晚',
                    seasonality: '四季'
                }
            ];
        } else if (filename.includes('recipe_ingredients')) {
            return [
                {
                    recipe_title: '小米粥',
                    ingredient_name_zh: '小米',
                    amount: '50g',
                    note: ''
                }
            ];
        }
        
        return [];
    }

    /**
     * 处理食材数据
     * @param {Array} rawData 原始数据
     * @returns {Array} 处理后的数据
     */
    processIngredients(rawData) {
        return rawData.map(item => {
            // 数据清理和标准化
            const processed = {
                ...item,
                name_zh: item.name_zh || '',
                gate_category: item.gate_category || '未分类',
                subcategory: item.subcategory || '未分类',
                four_qi: this.normalizeQi(item.four_qi),
                five_flavors: this.normalizeFlavor(item.five_flavors),
                meridians: this.normalizeMeridians(item.meridians),
                constitutions_suitable: this.normalizeConstitutions(item.constitutions_suitable),
                seasonality: this.normalizeSeasons(item.seasonality),
                primary_functions: item.primary_functions || '',
                indications: item.indications || '',
                contraindications: item.contraindications || '',
                pairing_good: item.pairing_good || '',
                pairing_bad: item.pairing_bad || '',
                dosage_note: item.dosage_note || '',
                prep_methods: item.prep_methods || '',
                modern_notes: item.modern_notes || ''
            };

            // 数据验证
            if (!this.validateIngredient(processed)) {
                console.warn('Invalid ingredient data:', processed);
            }

            return processed;
        }).filter(item => item.name_zh); // 过滤掉没有名称的记录
    }

    /**
     * 处理配方数据
     * @param {Array} rawData 原始数据
     * @returns {Array} 处理后的数据
     */
    processRecipes(rawData) {
        return rawData.map(item => {
            const processed = {
                ...item,
                title_zh: item.title_zh || '',
                intent_tags: item.intent_tags || '',
                constitution_tags: this.normalizeConstitutions(item.constitution_tags),
                seasonality: this.normalizeSeasons(item.seasonality),
                method: item.method || '',
                usage: item.usage || '',
                cautions: item.cautions || '',
                source_ref: item.source_ref || ''
            };

            // 数据验证
            if (!this.validateRecipe(processed)) {
                console.warn('Invalid recipe data:', processed);
            }

            return processed;
        }).filter(item => item.title_zh);
    }

    /**
     * 处理配方-食材关联数据
     * @param {Array} rawData 原始数据
     * @returns {Array} 处理后的数据
     */
    processRecipeIngredients(rawData) {
        return rawData.map(item => ({
            recipe_title: item.recipe_title || '',
            ingredient_name_zh: item.ingredient_name_zh || '',
            amount: item.amount || '',
            note: item.note || ''
        })).filter(item => item.recipe_title && item.ingredient_name_zh);
    }

    /**
     * 构建统计信息
     */
    buildStatistics() {
        this.stats.totalIngredients = this.ingredients.length;
        this.stats.totalRecipes = this.recipes.length;

        // 食材分类统计
        this.stats.categories = {};
        this.ingredients.forEach(item => {
            const category = item.gate_category;
            this.stats.categories[category] = (this.stats.categories[category] || 0) + 1;
        });
        this.stats.totalCategories = Object.keys(this.stats.categories).length;

        // 体质统计
        this.stats.constitutions = {};
        [...this.ingredients, ...this.recipes].forEach(item => {
            const constitutions = this.parseConstitutions(item.constitutions_suitable || item.constitution_tags || '');
            constitutions.forEach(constitution => {
                this.stats.constitutions[constitution] = (this.stats.constitutions[constitution] || 0) + 1;
            });
        });

        // 季节统计
        this.stats.seasons = {};
        [...this.ingredients, ...this.recipes].forEach(item => {
            const seasons = this.parseSeasons(item.seasonality || '');
            seasons.forEach(season => {
                this.stats.seasons[season] = (this.stats.seasons[season] || 0) + 1;
            });
        });

        // 四气统计
        this.stats.qi = {};
        this.ingredients.forEach(item => {
            const qi = item.four_qi;
            if (qi) {
                this.stats.qi[qi] = (this.stats.qi[qi] || 0) + 1;
            }
        });

        // 五味统计
        this.stats.flavors = {};
        this.ingredients.forEach(item => {
            const flavors = this.parseFlavors(item.five_flavors || '');
            flavors.forEach(flavor => {
                this.stats.flavors[flavor] = (this.stats.flavors[flavor] || 0) + 1;
            });
        });
    }

    /**
     * 建立数据索引
     */
    buildIndexes() {
        // 建立配方-食材映射
        this.recipeToIngredients = new Map();
        this.ingredientToRecipes = new Map();

        this.recipeIngredients.forEach(rel => {
            // 配方 -> 食材
            if (!this.recipeToIngredients.has(rel.recipe_title)) {
                this.recipeToIngredients.set(rel.recipe_title, []);
            }
            this.recipeToIngredients.get(rel.recipe_title).push({
                name: rel.ingredient_name_zh,
                amount: rel.amount,
                note: rel.note
            });

            // 食材 -> 配方
            if (!this.ingredientToRecipes.has(rel.ingredient_name_zh)) {
                this.ingredientToRecipes.set(rel.ingredient_name_zh, []);
            }
            this.ingredientToRecipes.get(rel.ingredient_name_zh).push(rel.recipe_title);
        });

        // 建立名称索引
        this.ingredientNameIndex = new Map();
        this.ingredients.forEach(item => {
            this.ingredientNameIndex.set(item.name_zh, item);
        });

        this.recipeNameIndex = new Map();
        this.recipes.forEach(item => {
            this.recipeNameIndex.set(item.title_zh, item);
        });
    }

    /**
     * 标准化四气数据
     */
    normalizeQi(qi) {
        if (!qi) return '';
        const normalized = qi.trim();
        const validQi = ['寒', '凉', '平', '温', '热'];
        return validQi.includes(normalized) ? normalized : '';
    }

    /**
     * 标准化五味数据
     */
    normalizeFlavor(flavor) {
        if (!flavor) return '';
        return flavor.split(/[,，、\s]+/).filter(f => f.trim()).join(',');
    }

    /**
     * 标准化归经数据
     */
    normalizeMeridians(meridians) {
        if (!meridians) return '';
        return meridians.split(/[,，、\s]+/).filter(m => m.trim()).join(',');
    }

    /**
     * 标准化体质数据
     */
    normalizeConstitutions(constitutions) {
        if (!constitutions) return '';
        let normalized = constitutions;
        
        // 应用体质映射
        Object.keys(CONFIG.dataProcessing.transforms.constitutionMapping).forEach(key => {
            const value = CONFIG.dataProcessing.transforms.constitutionMapping[key];
            normalized = normalized.replace(new RegExp(key, 'g'), value);
        });
        
        return normalized.split(/[,，、\s\/]+/).filter(c => c.trim()).join(',');
    }

    /**
     * 标准化季节数据
     */
    normalizeSeasons(seasons) {
        if (!seasons) return '';
        return seasons.split(/[,，、\s]+/).filter(s => s.trim()).join(',');
    }

    /**
     * 解析体质标签
     */
    parseConstitutions(constitutions) {
        if (!constitutions) return [];
        return constitutions.split(/[,，、\s\/]+/).filter(c => c.trim()).map(c => c.trim());
    }

    /**
     * 解析季节标签
     */
    parseSeasons(seasons) {
        if (!seasons) return [];
        return seasons.split(/[,，、\s]+/).filter(s => s.trim()).map(s => s.trim());
    }

    /**
     * 解析五味标签
     */
    parseFlavors(flavors) {
        if (!flavors) return [];
        return flavors.split(/[,，、\s]+/).filter(f => f.trim()).map(f => f.trim());
    }

    /**
     * 验证食材数据
     */
    validateIngredient(ingredient) {
        if (!ingredient.name_zh) return false;
        return true;
    }

    /**
     * 验证配方数据
     */
    validateRecipe(recipe) {
        if (!recipe.title_zh) return false;
        return true;
    }

    /**
     * 获取配方的食材列表
     */
    getRecipeIngredients(recipeTitle) {
        return this.recipeToIngredients.get(recipeTitle) || [];
    }

    /**
     * 获取食材相关的配方列表
     */
    getIngredientRecipes(ingredientName) {
        return this.ingredientToRecipes.get(ingredientName) || [];
    }

    /**
     * 根据ID获取食材
     */
    getIngredientByName(name) {
        return this.ingredientNameIndex.get(name);
    }

    /**
     * 根据ID获取配方
     */
    getRecipeByTitle(title) {
        return this.recipeNameIndex.get(title);
    }

    /**
     * 获取所有唯一的分类
     */
    getUniqueCategories() {
        return Utils.unique(this.ingredients.map(item => item.gate_category)).sort();
    }

    /**
     * 获取所有唯一的子分类
     */
    getUniqueSubcategories() {
        return Utils.unique(this.ingredients.map(item => item.subcategory)).sort();
    }

    /**
     * 获取所有唯一的四气
     */
    getUniqueQi() {
        return Utils.unique(this.ingredients.map(item => item.four_qi).filter(qi => qi)).sort();
    }

    /**
     * 获取所有唯一的五味
     */
    getUniqueFlavors() {
        const allFlavors = this.ingredients.flatMap(item => this.parseFlavors(item.five_flavors));
        return Utils.unique(allFlavors).sort();
    }

    /**
     * 获取所有唯一的体质
     */
    getUniqueConstitutions() {
        const allConstitutions = [...this.ingredients, ...this.recipes]
            .flatMap(item => this.parseConstitutions(item.constitutions_suitable || item.constitution_tags || ''));
        return Utils.unique(allConstitutions).sort();
    }

    /**
     * 获取所有唯一的季节
     */
    getUniqueSeasons() {
        const allSeasons = [...this.ingredients, ...this.recipes]
            .flatMap(item => this.parseSeasons(item.seasonality || ''));
        return Utils.unique(allSeasons).sort();
    }

    /**
     * 显示/隐藏加载动画
     */
    showLoading(show) {
        const overlay = Utils.dom.$('#loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * 重新加载数据
     */
    async reload() {
        // 清除缓存
        this.clearCache();
        
        // 重置状态
        this.isLoaded = false;
        this.ingredients = [];
        this.recipes = [];
        this.recipeIngredients = [];
        
        // 重新初始化
        return await this.initialize();
    }

    /**
     * 清除缓存
     */
    clearCache() {
        Object.values(CONFIG.dataSources).forEach(filename => {
            if (filename) {
                Utils.storage.remove(`csv_${filename}`);
            }
        });
        this.cache.clear();
    }

    /**
     * 导出数据
     */
    exportData(format = 'json', type = 'all') {
        let data = {};
        
        switch (type) {
            case 'ingredients':
                data = { ingredients: this.ingredients };
                break;
            case 'recipes':
                data = { recipes: this.recipes, recipeIngredients: this.recipeIngredients };
                break;
            case 'stats':
                data = { statistics: this.stats };
                break;
            default:
                data = {
                    ingredients: this.ingredients,
                    recipes: this.recipes,
                    recipeIngredients: this.recipeIngredients,
                    statistics: this.stats
                };
        }

        const filename = `suixiju_${type}_${Utils.formatDate(new Date(), 'YYYYMMDD_HHmmss')}`;
        
        if (format === 'json') {
            this.downloadJSON(data, filename);
        } else if (format === 'csv') {
            this.downloadCSV(data, filename);
        }
    }

    /**
     * 下载JSON文件
     */
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `${filename}.json`);
    }

    /**
     * 下载CSV文件
     */
    downloadCSV(data, filename) {
        // 简化的CSV导出，实际项目中可能需要更复杂的处理
        const csv = Papa.unparse(data.ingredients || data.recipes || []);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, `${filename}.csv`);
    }

    /**
     * 下载Blob文件
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 创建全局数据管理器实例
const dataManager = new DataManager();

// 导出数据管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.DataManager = DataManager;
    window.dataManager = dataManager;
}