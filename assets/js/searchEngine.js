/**
 * 搜索引擎
 * 提供强大的多维度搜索功能
 */

class SearchEngine {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.fuseEngine = null;
        this.currentResults = [];
        this.currentFilters = {};
        this.searchHistory = [];
        
        // 初始化搜索历史
        this.loadSearchHistory();
    }

    /**
     * 初始化搜索引擎
     */
    initialize() {
        if (!this.dataManager.isLoaded) {
            console.warn('Data not loaded yet');
            return;
        }

        this.buildSearchIndex();
        console.log('Search engine initialized');
    }

    /**
     * 构建搜索索引
     */
    buildSearchIndex() {
        Utils.performance.start('buildSearchIndex');

        // 合并所有可搜索的数据
        const searchableData = [];

        // 添加食材数据
        this.dataManager.ingredients.forEach(ingredient => {
            searchableData.push({
                type: 'ingredient',
                id: ingredient.name_zh,
                name_zh: ingredient.name_zh,
                category: ingredient.gate_category,
                subcategory: ingredient.subcategory,
                primary_functions: ingredient.primary_functions,
                indications: ingredient.indications,
                constitutions_suitable: ingredient.constitutions_suitable,
                four_qi: ingredient.four_qi,
                five_flavors: ingredient.five_flavors,
                meridians: ingredient.meridians,
                seasonality: ingredient.seasonality,
                searchText: this.buildSearchText(ingredient, 'ingredient'),
                data: ingredient
            });
        });

        // 添加配方数据
        this.dataManager.recipes.forEach(recipe => {
            const ingredients = this.dataManager.getRecipeIngredients(recipe.title_zh);
            const ingredientNames = ingredients.map(ing => ing.name).join(' ');
            
            searchableData.push({
                type: 'recipe',
                id: recipe.title_zh,
                name_zh: recipe.title_zh,
                intent_tags: recipe.intent_tags,
                constitution_tags: recipe.constitution_tags,
                seasonality: recipe.seasonality,
                method: recipe.method,
                usage: recipe.usage,
                ingredients: ingredientNames,
                searchText: this.buildSearchText(recipe, 'recipe', ingredientNames),
                data: recipe
            });
        });

        // 初始化Fuse搜索引擎
        this.fuseEngine = new Fuse(searchableData, {
            ...CONFIG.search.fuse,
            keys: [
                { name: 'name_zh', weight: 0.3 },
                { name: 'searchText', weight: 0.2 },
                { name: 'primary_functions', weight: 0.15 },
                { name: 'intent_tags', weight: 0.15 },
                { name: 'indications', weight: 0.1 },
                { name: 'ingredients', weight: 0.1 }
            ]
        });

        const indexTime = Utils.performance.end('buildSearchIndex');
        console.log(`Search index built in ${indexTime.toFixed(2)}ms`);
    }

    /**
     * 构建搜索文本
     */
    buildSearchText(item, type, extra = '') {
        let searchText = '';
        
        if (type === 'ingredient') {
            searchText = [
                item.name_zh,
                item.primary_functions,
                item.indications,
                item.constitutions_suitable,
                item.meridians,
                item.pairing_good,
                item.modern_notes
            ].filter(text => text).join(' ');
        } else if (type === 'recipe') {
            searchText = [
                item.title_zh,
                item.intent_tags,
                item.constitution_tags,
                item.method,
                item.usage,
                extra
            ].filter(text => text).join(' ');
        }
        
        return searchText;
    }

    /**
     * 执行搜索
     * @param {Object} searchParams 搜索参数
     * @returns {Array} 搜索结果
     */
    search(searchParams = {}) {
        Utils.performance.start('search');

        const {
            query = '',
            type = 'all', // all, ingredient, recipe
            constitution = '',
            season = '',
            qi = '',
            flavor = '',
            category = '',
            subcategory = '',
            sortBy = 'relevance',
            limit = CONFIG.search.pagination.defaultPageSize,
            offset = 0
        } = searchParams;

        let results = [];

        // 如果有关键词查询，使用Fuse搜索
        if (query.trim()) {
            const fuseResults = this.fuseEngine.search(query);
            results = fuseResults.map(result => ({
                ...result.item,
                score: result.score,
                matches: result.matches
            }));
        } else {
            // 无关键词时，返回所有数据
            results = this.fuseEngine._docs.map(item => ({
                ...item,
                score: 0,
                matches: []
            }));
        }

        // 应用类型过滤
        if (type !== 'all') {
            results = results.filter(item => item.type === type);
        }

        // 应用其他过滤条件
        results = this.applyFilters(results, {
            constitution,
            season,
            qi,
            flavor,
            category,
            subcategory
        });

        // 排序
        results = this.sortResults(results, sortBy);

        // 保存当前结果和过滤条件
        this.currentResults = results;
        this.currentFilters = searchParams;

        // 记录搜索历史
        if (query.trim()) {
            this.addToSearchHistory(query, results.length);
        }

        const searchTime = Utils.performance.end('search');
        console.log(`Search completed in ${searchTime.toFixed(2)}ms, found ${results.length} results`);

        // 分页
        const paginatedResults = results.slice(offset, offset + limit);
        
        return {
            results: paginatedResults,
            total: results.length,
            hasMore: offset + limit < results.length,
            searchTime: searchTime,
            query: query
        };
    }

    /**
     * 应用过滤条件
     */
    applyFilters(results, filters) {
        return results.filter(item => {
            // 体质过滤
            if (filters.constitution) {
                const constitutions = item.constitutions_suitable || item.constitution_tags || '';
                if (!Utils.includesIgnoreCase(constitutions, filters.constitution)) {
                    return false;
                }
            }

            // 季节过滤
            if (filters.season) {
                const seasonality = item.seasonality || '';
                if (!Utils.includesIgnoreCase(seasonality, filters.season)) {
                    return false;
                }
            }

            // 四气过滤
            if (filters.qi && item.type === 'ingredient') {
                if (item.four_qi !== filters.qi) {
                    return false;
                }
            }

            // 五味过滤
            if (filters.flavor && item.type === 'ingredient') {
                const flavors = item.five_flavors || '';
                if (!Utils.includesIgnoreCase(flavors, filters.flavor)) {
                    return false;
                }
            }

            // 分类过滤
            if (filters.category && item.type === 'ingredient') {
                if (item.category !== filters.category) {
                    return false;
                }
            }

            // 子分类过滤
            if (filters.subcategory && item.type === 'ingredient') {
                if (item.subcategory !== filters.subcategory) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * 排序结果
     */
    sortResults(results, sortBy) {
        switch (sortBy) {
            case 'name':
                return results.sort((a, b) => a.name_zh.localeCompare(b.name_zh, 'zh-CN'));
            
            case 'category':
                return results.sort((a, b) => {
                    const categoryA = a.category || a.type;
                    const categoryB = b.category || b.type;
                    return categoryA.localeCompare(categoryB, 'zh-CN');
                });
            
            case 'qi':
                return results.sort((a, b) => {
                    const qiOrder = { '寒': 1, '凉': 2, '平': 3, '温': 4, '热': 5 };
                    return (qiOrder[a.four_qi] || 99) - (qiOrder[b.four_qi] || 99);
                });
            
            case 'relevance':
            default:
                return results.sort((a, b) => (a.score || 0) - (b.score || 0));
        }
    }

    /**
     * 获取搜索建议
     */
    getSuggestions(query, limit = 10) {
        if (!query || query.length < 2) return [];

        const suggestions = [];
        const lowerQuery = query.toLowerCase();

        // 从食材名称中提取建议
        this.dataManager.ingredients.forEach(ingredient => {
            if (ingredient.name_zh.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    text: ingredient.name_zh,
                    type: 'ingredient',
                    category: '食材'
                });
            }
        });

        // 从配方名称中提取建议
        this.dataManager.recipes.forEach(recipe => {
            if (recipe.title_zh.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    text: recipe.title_zh,
                    type: 'recipe',
                    category: '配方'
                });
            }
        });

        // 从功效中提取建议
        const functionKeywords = new Set();
        this.dataManager.ingredients.forEach(ingredient => {
            if (ingredient.primary_functions) {
                ingredient.primary_functions.split(/[,，、\s]+/).forEach(func => {
                    if (func.toLowerCase().includes(lowerQuery)) {
                        functionKeywords.add(func);
                    }
                });
            }
        });

        functionKeywords.forEach(keyword => {
            suggestions.push({
                text: keyword,
                type: 'function',
                category: '功效'
            });
        });

        // 去重并限制数量
        return Utils.unique(suggestions, 'text').slice(0, limit);
    }

    /**
     * 高级搜索
     */
    advancedSearch(conditions = []) {
        Utils.performance.start('advancedSearch');

        let results = this.fuseEngine._docs;

        conditions.forEach(condition => {
            const { field, operator, value } = condition;
            
            results = results.filter(item => {
                const fieldValue = Utils.get(item, field, '');
                
                switch (operator) {
                    case 'contains':
                        return Utils.includesIgnoreCase(fieldValue, value);
                    case 'equals':
                        return fieldValue === value;
                    case 'not_contains':
                        return !Utils.includesIgnoreCase(fieldValue, value);
                    case 'not_equals':
                        return fieldValue !== value;
                    case 'starts_with':
                        return fieldValue.toLowerCase().startsWith(value.toLowerCase());
                    case 'ends_with':
                        return fieldValue.toLowerCase().endsWith(value.toLowerCase());
                    default:
                        return true;
                }
            });
        });

        const searchTime = Utils.performance.end('advancedSearch');
        console.log(`Advanced search completed in ${searchTime.toFixed(2)}ms`);

        return {
            results: results,
            total: results.length,
            searchTime: searchTime
        };
    }

    /**
     * 相似推荐
     */
    findSimilar(item, limit = 5) {
        if (!item) return [];

        const searchText = item.type === 'ingredient' 
            ? item.primary_functions || ''
            : item.intent_tags || '';

        if (!searchText) return [];

        const results = this.fuseEngine.search(searchText);
        
        return results
            .filter(result => result.item.id !== item.id)
            .slice(0, limit)
            .map(result => result.item);
    }

    /**
     * 搜索历史管理
     */
    addToSearchHistory(query, resultCount) {
        if (!CONFIG.features.searchHistory) return;

        const historyItem = {
            query: query,
            resultCount: resultCount,
            timestamp: Date.now()
        };

        // 移除重复项
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        
        // 添加到开头
        this.searchHistory.unshift(historyItem);
        
        // 限制历史数量
        if (this.searchHistory.length > CONFIG.storage.limits.maxSearchHistory) {
            this.searchHistory = this.searchHistory.slice(0, CONFIG.storage.limits.maxSearchHistory);
        }

        this.saveSearchHistory();
    }

    /**
     * 获取搜索历史
     */
    getSearchHistory(limit = 10) {
        return this.searchHistory.slice(0, limit);
    }

    /**
     * 清除搜索历史
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    /**
     * 保存搜索历史到本地存储
     */
    saveSearchHistory() {
        Utils.storage.set(CONFIG.storage.keys.searchHistory, this.searchHistory);
    }

    /**
     * 从本地存储加载搜索历史
     */
    loadSearchHistory() {
        this.searchHistory = Utils.storage.get(CONFIG.storage.keys.searchHistory, []);
    }

    /**
     * 热门搜索词
     */
    getPopularSearches(limit = 10) {
        const searchCounts = {};
        
        this.searchHistory.forEach(item => {
            searchCounts[item.query] = (searchCounts[item.query] || 0) + 1;
        });

        return Object.entries(searchCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query, count]) => ({ query, count }));
    }

    /**
     * 搜索统计
     */
    getSearchStats() {
        const totalSearches = this.searchHistory.length;
        const uniqueQueries = new Set(this.searchHistory.map(item => item.query)).size;
        const avgResultCount = totalSearches > 0 
            ? this.searchHistory.reduce((sum, item) => sum + item.resultCount, 0) / totalSearches 
            : 0;

        const recentSearches = this.searchHistory
            .filter(item => Date.now() - item.timestamp < 24 * 60 * 60 * 1000)
            .length;

        return {
            totalSearches,
            uniqueQueries,
            avgResultCount: Math.round(avgResultCount),
            recentSearches
        };
    }

    /**
     * 导出搜索结果
     */
    exportResults(format = 'csv') {
        if (this.currentResults.length === 0) {
            Toast.warning('提示', '没有可导出的搜索结果');
            return;
        }

        const exportData = this.currentResults.map(item => ({
            名称: item.name_zh,
            类型: item.type === 'ingredient' ? '食材' : '配方',
            分类: item.category || '',
            功效: item.primary_functions || item.intent_tags || '',
            体质: item.constitutions_suitable || item.constitution_tags || '',
            四气: item.four_qi || '',
            五味: item.five_flavors || '',
            季节: item.seasonality || ''
        }));

        const filename = `搜索结果_${Utils.formatDate(new Date(), 'YYYYMMDD_HHmmss')}`;
        
        if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            this.downloadBlob(blob, `${filename}.csv`);
        } else if (format === 'json') {
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            this.downloadBlob(blob, `${filename}.json`);
        }

        Toast.success('导出成功', `已导出 ${exportData.length} 条搜索结果`);
    }

    /**
     * 下载文件
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

// 导出搜索引擎
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchEngine;
} else {
    window.SearchEngine = SearchEngine;
}