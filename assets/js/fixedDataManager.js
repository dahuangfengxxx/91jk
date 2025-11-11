/**
 * 简化的数据管理器 - 直接使用CSV数据
 */

class SimpleDataManagerFixed {
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
            console.log('🔄 Starting fixed data initialization...');
            this.showLoading(true);
            
            // 直接使用CSV文件
            await this.loadCSVData();
            
            console.log(`✅ 成功加载: ${this.ingredients.length} 种食材, ${this.recipes.length} 个配方, ${this.recipeIngredients.length} 个配方食材关系`);
            
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
            
            // 降级方案：使用硬编码数据
            this.loadFallbackData();
            return true;
        }
    }

    /**
     * 加载CSV数据
     */
    async loadCSVData() {
        // 确保Papa Parse可用
        if (!window.Papa) {
            await this.loadPapaParse();
        }

        const files = [
            { url: 'ingredients_master.csv', key: 'ingredients' },
            { url: 'recipes_master.csv', key: 'recipes' },
            { url: 'recipe_ingredients_restructured.csv', key: 'recipeIngredients' }
        ];

        for (const file of files) {
            try {
                const response = await fetch(file.url);
                if (!response.ok) {
                    console.warn(`⚠️ 加载 ${file.url} 失败: ${response.status}`);
                    continue;
                }
                const text = await response.text();
                
                await new Promise((resolve, reject) => {
                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            this[file.key] = results.data.filter(row => 
                                row && Object.keys(row).length > 1
                            );
                            console.log(`✅ 加载 ${file.key}: ${this[file.key].length} 条记录`);
                            resolve();
                        },
                        error: reject
                    });
                });
            } catch (error) {
                console.warn(`⚠️ 加载 ${file.url} 失败:`, error.message);
            }
        }
    }

    /**
     * 加载Papa Parse库
     */
    async loadPapaParse() {
        return new Promise((resolve, reject) => {
            if (window.Papa) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 降级数据
     */
    loadFallbackData() {
        console.log('🔄 加载降级数据...');
        
        this.ingredients = [
            {
                name_zh: '西红柿',
                gate_category: '蔬菜',
                four_qi: '微寒',
                five_flavors: '酸、甘',
                meridians: '肝;胃',
                primary_functions: '清热解毒;生津止渴;健胃消食',
                indications: '热病伤津;食欲不振;高血压',
                constitutions_suitable: '湿热、阴虚、平和',
                contraindications: '脾胃虚寒慎',
                seasonality: '夏、秋',
                pairing_good: '鸡蛋;牛肉;豆腐',
                pairing_bad: '胡萝卜;白萝卜',
                modern_notes: '富含番茄红素、维生素C，具抗氧化、护心血管作用。'
            },
            {
                name_zh: '虾',
                gate_category: '海产类',
                four_qi: '温',
                five_flavors: '甘',
                meridians: '肝;肾',
                primary_functions: '补肾壮阳;通乳',
                indications: '肾虚阳痿;乳汁不通',
                constitutions_suitable: '阳虚、气虚',
                contraindications: '过敏体质慎',
                seasonality: '四季',
                modern_notes: '高蛋白低脂肪，富含钙质。'
            },
            {
                name_zh: '羊肉',
                gate_category: '畜肉',
                four_qi: '温',
                five_flavors: '甘',
                meridians: '脾;肾',
                primary_functions: '温中补虚;益肾气',
                indications: '虚劳羸瘦;腰膝酸软',
                constitutions_suitable: '阳虚、气虚',
                contraindications: '热性体质慎',
                seasonality: '冬',
                modern_notes: '富含优质蛋白质和铁质。'
            }
        ];

        this.isLoaded = true;
        this.buildStats();
        
        // 触发事件
        window.dispatchEvent(new CustomEvent('dataLoaded', { detail: this }));
        
        console.log('✅ 降级数据加载完成');
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
                (item.name_zh && item.name_zh.toLowerCase().includes(searchTerm)) ||
                (item.primary_functions && item.primary_functions.toLowerCase().includes(searchTerm)) ||
                (item.indications && item.indications.toLowerCase().includes(searchTerm)) ||
                (item.gate_category && item.gate_category.toLowerCase().includes(searchTerm))
            );
        }
        
        return results;
    }

    /**
     * 获取配方的食材列表
     */
    getRecipeIngredients(recipeName) {
        if (!this.recipeIngredients || this.recipeIngredients.length === 0) {
            console.warn('配方食材数据未加载');
            return [];
        }

        // 在重构后的数据中查找配方
        const recipeRecord = this.recipeIngredients.find(record => 
            (record['菜谱名称'] === recipeName) || (record.recipe_title === recipeName)
        );

        if (!recipeRecord) {
            console.warn(`未找到配方: ${recipeName}`);
            return [];
        }

        const ingredients = [];
        
        // 解析所有配料字段
        for (let i = 1; i <= 10; i++) {
            const nameField = `配料${i}_名称`;
            const amountField = `配料${i}_用量`;
            const noteField = `配料${i}_备注`;
            
            const name = recipeRecord[nameField];
            if (name && name.trim()) {
                ingredients.push({
                    ingredient_name_zh: name.trim(),
                    amount: recipeRecord[amountField] || '',
                    notes: recipeRecord[noteField] || ''
                });
            }
        }

        console.log(`🥘 配方"${recipeName}"的配料:`, ingredients);
        return ingredients;
    }

    /**
     * 获取食材相关的配方
     */
    getIngredientRecipes(ingredientName) {
        if (!this.recipeIngredients || this.recipeIngredients.length === 0) {
            console.warn('配方食材数据未加载');
            return [];
        }

        const relatedRecipeNames = [];
        
        // 遍历每个配方记录
        this.recipeIngredients.forEach(recipeRecord => {
            const recipeName = recipeRecord['菜谱名称'] || recipeRecord.recipe_title;
            if (!recipeName) return;
            
            // 检查所有配料字段
            for (let i = 1; i <= 10; i++) {
                const ingredientField = `配料${i}_名称`;  // 修复：移除错误的 || 语法
                const ingredient = recipeRecord[ingredientField];
                
                if (ingredient && ingredient.includes(ingredientName)) {
                    if (!relatedRecipeNames.includes(recipeName)) {
                        relatedRecipeNames.push(recipeName);
                    }
                    break; // 找到匹配就跳出内层循环
                }
            }
        });

        console.log(`🔍 为食材"${ingredientName}"找到相关配方:`, relatedRecipeNames);
        
        // 返回匹配的配方详情
        return this.recipes.filter(recipe => 
            relatedRecipeNames.includes(recipe.title_zh || recipe['菜谱名称'])
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
    }
}

// 创建全局实例
const fixedDataManager = new SimpleDataManagerFixed();

// 替换原有的dataManager
const dataManager = fixedDataManager;

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleDataManagerFixed;
} else {
    window.SimpleDataManagerFixed = SimpleDataManagerFixed;
    window.dataManager = dataManager;
    window.fixedDataManager = fixedDataManager;
}