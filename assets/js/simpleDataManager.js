/**
 * 简化的数据管理器 - 针对重构后的数据
 */

class SimpleDataManager {
    constructor() {
        this.ingredients = [];
        this.recipes = [];
        this.recipeIngredients = [];
        this.isLoaded = false;
        
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
     */
    async initialize() {
        try {
            console.log('Starting simplified data initialization...');
            this.showLoading(true);
            
            // 加载重构后的数据
            console.log('Loading restructured data...');
            const [ingredientsData, recipesData, recipeIngredientsData] = await Promise.all([
                this.loadCSVFile('ingredients_master.csv'),
                this.loadCSVFile('recipes_master.csv'),
                this.loadCSVFile('recipe_ingredients_restructured.csv')
            ]);

            // 处理数据
            this.ingredients = this.processIngredientsData(ingredientsData);
            this.recipes = this.processRecipesData(recipesData);
            this.recipeIngredients = this.processRecipeIngredientsData(recipeIngredientsData);

            console.log(`Loaded: ${this.ingredients.length} ingredients, ${this.recipes.length} recipes`);

            // 构建统计信息
            this.buildStats();
            
            this.isLoaded = true;
            this.showLoading(false);
            
            // 触发数据加载完成事件
            window.dispatchEvent(new CustomEvent('dataLoaded', { 
                detail: { 
                    ingredients: this.ingredients.length,
                    recipes: this.recipes.length 
                } 
            }));
            
            return true;
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showLoading(false);
            this.showErrorMessage(error);
            return false;
        }
    }

    /**
     * 加载CSV文件
     */
    async loadCSVFile(filename) {
        try {
            console.log(`Loading: ${filename}`);
            const response = await fetch(filename);
            
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}: ${response.status}`);
            }
            
            const csvText = await response.text();
            
            // 使用Papa Parse解析CSV
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
                return Object.values(row).some(value => value && value.trim());
            });

            console.log(`Parsed ${data.length} records from ${filename}`);
            return data;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
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
                    gate_category: '谷类',
                    subcategory: '谷物',
                    four_qi: '平',
                    five_flavors: '甘',
                    meridians: '脾,胃',
                    primary_functions: '健脾益气',
                    indications: '脾胃虚弱',
                    constitutions_suitable: '气虚',
                    seasonality: '四季',
                    dosage_note: '30-60g',
                    modern_notes: '优质碳水化合物'
                },
                {
                    name_zh: '小米',
                    gate_category: '谷类',
                    subcategory: '谷物',
                    four_qi: '平',
                    five_flavors: '甘',
                    meridians: '脾,胃',
                    primary_functions: '健脾养胃',
                    indications: '胃弱纳差',
                    constitutions_suitable: '气虚,脾虚',
                    seasonality: '四季',
                    dosage_note: '30-50g',
                    modern_notes: '易消化谷物'
                }
            ];
        } else if (filename.includes('recipes')) {
            return [
                {
                    title_zh: '小米粥',
                    intent_tags: '健脾养胃',
                    constitution_tags: '气虚,脾虚',
                    method: '小火煮粥',
                    usage: '每日早晚',
                    cautions: '无特殊禁忌',
                    seasonality: '四季',
                    source_ref: ''
                }
            ];
        } else {
            // 重构后的配料数据格式
            return [
                {
                    菜谱名称: '小米粥',
                    配料总数: 2,
                    配料1_名称: '小米',
                    配料1_用量: '50g',
                    配料1_备注: '',
                    配料2_名称: '水',
                    配料2_用量: '500ml',
                    配料2_备注: '',
                    配料3_名称: '',
                    配料3_用量: '',
                    配料3_备注: ''
                }
            ];
        }
    }

    /**
     * 处理食材数据
     */
    processIngredientsData(rawData) {
        return rawData.map(item => ({
            name_zh: item.name_zh || '',
            gate_category: item.gate_category || '未分类',
            subcategory: item.subcategory || '',
            four_qi: item.four_qi || '',
            five_flavors: item.five_flavors || '',
            meridians: item.meridians || '',
            primary_functions: item.primary_functions || '',
            indications: item.indications || '',
            constitutions_suitable: item.constitutions_suitable || '',
            seasonality: item.seasonality || '',
            dosage_note: item.dosage_note || '',
            modern_notes: item.modern_notes || '',
            contraindications: item.contraindications || '',
            pairing_good: item.pairing_good || '',
            pairing_bad: item.pairing_bad || ''
        })).filter(item => item.name_zh);
    }

    /**
     * 处理配方数据
     */
    processRecipesData(rawData) {
        return rawData.map(item => ({
            title_zh: item.title_zh || '',
            intent_tags: item.intent_tags || '',
            constitution_tags: item.constitution_tags || '',
            method: item.method || '',
            usage: item.usage || '',
            cautions: item.cautions || '',
            seasonality: item.seasonality || '',
            source_ref: item.source_ref || ''
        })).filter(item => item.title_zh);
    }

    /**
     * 处理重构后的配料数据
     */
    processRecipeIngredientsData(rawData) {
        const ingredients = [];
        
        rawData.forEach(row => {
            const recipeName = row['菜谱名称'];
            const totalIngredients = parseInt(row['配料总数']) || 0;
            
            if (!recipeName) return;
            
            // 提取每个配料信息
            for (let i = 1; i <= totalIngredients; i++) {
                const name = row[`配料${i}_名称`];
                const amount = row[`配料${i}_用量`];
                const note = row[`配料${i}_备注`] || '';
                
                if (name && amount) {
                    ingredients.push({
                        recipe_title: recipeName,
                        ingredient_name_zh: name,
                        amount: amount,
                        note: note
                    });
                }
            }
        });
        
        return ingredients;
    }

    /**
     * 构建统计信息
     */
    buildStats() {
        this.stats.totalIngredients = this.ingredients.length;
        this.stats.totalRecipes = this.recipes.length;

        // 分类统计
        this.stats.categories = {};
        this.ingredients.forEach(item => {
            const category = item.gate_category || '未分类';
            this.stats.categories[category] = (this.stats.categories[category] || 0) + 1;
        });
        this.stats.totalCategories = Object.keys(this.stats.categories).length;

        // 体质统计
        this.stats.constitutions = {};
        [...this.ingredients, ...this.recipes].forEach(item => {
            const constitutions = this.parseList(item.constitutions_suitable || item.constitution_tags || '');
            constitutions.forEach(constitution => {
                this.stats.constitutions[constitution] = (this.stats.constitutions[constitution] || 0) + 1;
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
            const flavors = this.parseList(item.five_flavors || '');
            flavors.forEach(flavor => {
                this.stats.flavors[flavor] = (this.stats.flavors[flavor] || 0) + 1;
            });
        });

        // 季节统计
        this.stats.seasons = {};
        [...this.ingredients, ...this.recipes].forEach(item => {
            const seasons = this.parseList(item.seasonality || '');
            seasons.forEach(season => {
                this.stats.seasons[season] = (this.stats.seasons[season] || 0) + 1;
            });
        });
    }

    /**
     * 解析逗号分隔的列表
     */
    parseList(str) {
        if (!str) return [];
        return str.split(/[,，、\s\/]+/).filter(item => item.trim()).map(item => item.trim());
    }

    /**
     * 搜索功能
     */
    search(query, filters = {}) {
        let results = [];
        
        // 如果没有查询词，返回所有数据
        if (!query || query.trim() === '') {
            results = [...this.ingredients, ...this.recipes];
        } else {
            const searchTerm = query.toLowerCase();
            
            // 搜索食材
            const ingredientResults = this.ingredients.filter(item => {
                return item.name_zh.toLowerCase().includes(searchTerm) ||
                       item.primary_functions.toLowerCase().includes(searchTerm) ||
                       item.indications.toLowerCase().includes(searchTerm) ||
                       item.constitutions_suitable.toLowerCase().includes(searchTerm);
            });
            
            // 搜索配方
            const recipeResults = this.recipes.filter(item => {
                return item.title_zh.toLowerCase().includes(searchTerm) ||
                       item.intent_tags.toLowerCase().includes(searchTerm) ||
                       item.constitution_tags.toLowerCase().includes(searchTerm);
            });
            
            results = [...ingredientResults, ...recipeResults];
        }
        
        // 应用过滤器
        if (filters.constitution) {
            results = results.filter(item => {
                const constitutions = item.constitutions_suitable || item.constitution_tags || '';
                return constitutions.includes(filters.constitution);
            });
        }
        
        if (filters.season) {
            results = results.filter(item => {
                const seasons = item.seasonality || '';
                return seasons.includes(filters.season) || seasons.includes('四季');
            });
        }
        
        if (filters.qi) {
            results = results.filter(item => {
                return item.four_qi === filters.qi;
            });
        }
        
        if (filters.category) {
            results = results.filter(item => {
                return item.gate_category === filters.category;
            });
        }
        
        return results;
    }

    /**
     * 获取配方的配料列表
     */
    getRecipeIngredients(recipeTitle) {
        return this.recipeIngredients.filter(item => item.recipe_title === recipeTitle);
    }

    /**
     * 获取食材相关的配方
     */
    getIngredientRecipes(ingredientName) {
        const recipeNames = this.recipeIngredients
            .filter(item => item.ingredient_name_zh === ingredientName)
            .map(item => item.recipe_title);
        
        return this.recipes.filter(recipe => recipeNames.includes(recipe.title_zh));
    }

    /**
     * 获取唯一值列表
     */
    getUniqueCategories() {
        return [...new Set(this.ingredients.map(item => item.gate_category))].filter(Boolean).sort();
    }

    getUniqueConstitutions() {
        const allConstitutions = [...this.ingredients, ...this.recipes]
            .flatMap(item => this.parseList(item.constitutions_suitable || item.constitution_tags || ''));
        return [...new Set(allConstitutions)].filter(Boolean).sort();
    }

    getUniqueSeasons() {
        const allSeasons = [...this.ingredients, ...this.recipes]
            .flatMap(item => this.parseList(item.seasonality || ''));
        return [...new Set(allSeasons)].filter(Boolean).sort();
    }

    getUniqueQi() {
        return [...new Set(this.ingredients.map(item => item.four_qi))].filter(Boolean).sort();
    }

    getUniqueFlavors() {
        const allFlavors = this.ingredients.flatMap(item => this.parseList(item.five_flavors || ''));
        return [...new Set(allFlavors)].filter(Boolean).sort();
    }

    /**
     * 显示/隐藏加载动画
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * 显示错误消息
     */
    showErrorMessage(error) {
        const errorHtml = `
            <div class="error-message" style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 2rem; margin: 2rem; border-radius: 8px; text-align: center;">
                <h3 style="color: #721c24; margin: 0 0 1rem 0;">🚨 数据加载失败</h3>
                <p style="color: #721c24; margin: 0 0 1rem 0;">
                    无法加载数据文件，请检查：
                </p>
                <ul style="color: #721c24; text-align: left; margin: 0 0 1rem 0; display: inline-block;">
                    <li>文件是否存在</li>
                    <li>网络连接是否正常</li>
                    <li>使用HTTP协议访问（不是file://）</li>
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
}

// 创建全局实例
const simpleDataManager = new SimpleDataManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleDataManager;
} else {
    window.SimpleDataManager = SimpleDataManager;
    window.dataManager = simpleDataManager;
}