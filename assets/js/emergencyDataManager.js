// 应急修复版本数据管理器
class EmergencyDataManager {
    constructor() {
        this.ingredients = [];
        this.recipes = [];
        this.recipeIngredients = [];
        this.isLoaded = false;
        this.stats = {
            constitutions: [],
            categories: [],
            seasonality: []
        };
    }

    async initialize() {
        try {
            console.log('🚨 应急数据管理器启动...');
            this.showLoading(true);

            // 直接使用CSV文件，简化错误处理
            await this.loadCSVData();

            console.log(`✅ 应急加载完成: ${this.ingredients.length} 种食材, ${this.recipes.length} 个配方, ${this.recipeIngredients.length} 个配方食材关系`);

            this.buildStats();
            this.isLoaded = true;
            this.showLoading(false);

            // 触发数据加载完成事件
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('dataLoaded', { detail: this }));
            }

            return true;

        } catch (error) {
            console.error('❌ 应急初始化失败:', error);
            this.showLoading(false);
            this.loadFallbackData();
            return true;
        }
    }

    async loadCSVData() {
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
                console.log(`🔄 加载 ${file.url}...`);
                const response = await fetch(file.url, {
                    method: 'GET',
                    cache: 'no-cache'
                });
                
                if (!response.ok) {
                    console.warn(`⚠️ ${file.url} 加载失败: ${response.status} ${response.statusText}`);
                    continue;
                }
                
                const text = await response.text();
                console.log(`📄 ${file.url} 文本长度: ${text.length}`);

                await new Promise((resolve, reject) => {
                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            this[file.key] = results.data.filter(row => 
                                row && Object.keys(row).length > 1
                            );
                            console.log(`✅ 解析 ${file.key}: ${this[file.key].length} 条记录`);
                            resolve();
                        },
                        error: (error) => {
                            console.error(`❌ 解析 ${file.url} 失败:`, error);
                            reject(error);
                        }
                    });
                });
            } catch (error) {
                console.warn(`⚠️ 加载 ${file.url} 遇到错误:`, error.message);
            }
        }
    }

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

    buildStats() {
        // 构建统计信息的简化版本
        this.stats.constitutions = [...new Set(
            this.ingredients.map(i => i.constitutions_suitable || '').join(',').split(',')
                .filter(c => c && c.trim()).map(c => c.trim())
        )];
        
        this.stats.categories = [...new Set(
            this.ingredients.map(i => i.gate_category).filter(Boolean)
        )];
    }

    // 复制原有的关键方法
    getIngredientRecipes(ingredientName) {
        if (!this.recipeIngredients || this.recipeIngredients.length === 0) {
            console.warn('配方食材数据未加载');
            return [];
        }

        const relatedRecipeNames = [];
        
        this.recipeIngredients.forEach(recipeRecord => {
            const recipeName = recipeRecord['菜谱名称'] || recipeRecord.recipe_title;
            if (!recipeName) return;
            
            for (let i = 1; i <= 10; i++) {
                const ingredientField = `配料${i}_名称`;
                const ingredient = recipeRecord[ingredientField];
                
                if (ingredient && ingredient.includes(ingredientName)) {
                    if (!relatedRecipeNames.includes(recipeName)) {
                        relatedRecipeNames.push(recipeName);
                    }
                    break;
                }
            }
        });

        return this.recipes.filter(recipe => 
            relatedRecipeNames.includes(recipe.title_zh || recipe['菜谱名称'])
        );
    }

    getRecipeIngredients(recipeName) {
        if (!this.recipeIngredients || this.recipeIngredients.length === 0) {
            console.warn('配方食材数据未加载');
            return [];
        }

        const recipeRecord = this.recipeIngredients.find(record => 
            (record['菜谱名称'] === recipeName) || (record.recipe_title === recipeName)
        );

        if (!recipeRecord) {
            console.warn(`未找到配方: ${recipeName}`);
            return [];
        }

        const ingredients = [];
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

        return ingredients;
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    loadFallbackData() {
        console.log('🔄 加载降级数据...');
        // 提供基本的降级数据
        this.ingredients = [
            { name_zh: '胡萝卜', gate_category: '蔬菜类', primary_functions: '健脾消食，明目' },
            { name_zh: '白菜', gate_category: '蔬菜类', primary_functions: '清热解毒，通利肠胃' }
        ];
        this.recipes = [];
        this.recipeIngredients = [];
        this.isLoaded = true;
        this.showLoading(false);
    }
}

// 如果在浏览器环境中，替换原有的数据管理器
if (typeof window !== 'undefined') {
    window.FixedDataManager = EmergencyDataManager;
}