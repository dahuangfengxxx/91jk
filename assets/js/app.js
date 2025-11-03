/**
 * 主应用程序
 * 负责应用的初始化、事件绑定和核心逻辑
 */

class App {
    constructor() {
        this.searchEngine = null;
        this.favoriteManager = null;
        this.currentView = 'search';
        this.currentPage = 1;
        this.pageSize = CONFIG.search.pagination.defaultPageSize;
        this.currentResults = [];
        this.isInitialized = false;
        
        // 绑定方法到当前实例
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleViewChange = this.handleViewChange.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('Initializing application...');
            
            // 显示加载动画
            Components.Loading.show('正在初始化应用...');

            // 初始化数据管理器
            const dataLoaded = await dataManager.initialize();
            if (!dataLoaded) {
                throw new Error('Data loading failed');
            }

            // 初始化搜索引擎
            this.searchEngine = new SearchEngine(dataManager);
            this.searchEngine.initialize();

            // 初始化收藏管理器
            this.favoriteManager = new FavoriteManager();

            // 初始化UI组件
            this.initializeUI();

            // 绑定事件
            this.bindEvents();

            // 初始化图表
            Charts.init();
            Charts.updateStats();

            // 设置主题
            this.initializeTheme();

            // 更新收藏数量显示
            this.updateFavoritesCount();

            // 隐藏加载动画
            Components.Loading.hide();

            this.isInitialized = true;
            console.log('Application initialized successfully');

            // 显示成功消息
            Toast.success('初始化完成', '食疗检索平台已准备就绪');

        } catch (error) {
            console.error('Application initialization failed:', error);
            Components.Loading.hide();
            Toast.error('初始化失败', '应用启动时发生错误，请刷新页面重试');
        }
    }

    /**
     * 初始化UI组件
     */
    initializeUI() {
        // 初始化搜索表单
        this.initializeSearchForm();
        
        // 初始化筛选表单
        this.initializeFilterForms();
        
        // 显示默认数据
        this.showDefaultData();
    }

    /**
     * 初始化搜索表单
     */
    initializeSearchForm() {
        // 填充下拉选项
        this.populateSelectOptions('#constitution-filter', dataManager.getUniqueConstitutions());
        this.populateSelectOptions('#season-filter', dataManager.getUniqueSeasons());
        this.populateSelectOptions('#qi-filter', dataManager.getUniqueQi());
        this.populateSelectOptions('#flavor-filter', dataManager.getUniqueFlavors());
    }

    /**
     * 初始化筛选表单
     */
    initializeFilterForms() {
        // 食材筛选表单
        this.populateSelectOptions('#ing-category', dataManager.getUniqueCategories());
        this.populateSelectOptions('#ing-subcategory', dataManager.getUniqueSubcategories());
        this.populateSelectOptions('#ing-qi', dataManager.getUniqueQi());
        this.populateSelectOptions('#ing-flavor', dataManager.getUniqueFlavors());

        // 配方筛选表单
        this.populateSelectOptions('#recipe-constitution', dataManager.getUniqueConstitutions());
    }

    /**
     * 填充下拉选项
     */
    populateSelectOptions(selector, options) {
        const select = Utils.dom.$(selector);
        if (!select) return;

        // 保留第一个选项（通常是"全部"或"不限"）
        const firstOption = select.querySelector('option');
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        }

        // 添加新选项
        options.forEach(option => {
            const optionElement = Utils.dom.create('option', { value: option }, option);
            select.appendChild(optionElement);
        });
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 导航标签切换
        Utils.dom.$$('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                this.switchPanel(target);
            });
        });

        // 搜索功能
        const searchBtn = Utils.dom.$('#search-btn');
        const advancedSearchBtn = Utils.dom.$('#advanced-search');
        const clearSearchBtn = Utils.dom.$('#clear-search');
        
        if (searchBtn) searchBtn.addEventListener('click', this.handleSearch);
        if (advancedSearchBtn) advancedSearchBtn.addEventListener('click', this.handleSearch);
        if (clearSearchBtn) clearSearchBtn.addEventListener('click', this.clearSearch.bind(this));

        // 搜索输入框回车事件
        const searchInput = Utils.dom.$('#global-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });

            // 搜索建议
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.showSearchSuggestions(e.target.value);
            }, 300));
        }

        // 筛选功能
        const applyIngFilterBtn = Utils.dom.$('#apply-ing-filter');
        const resetIngFilterBtn = Utils.dom.$('#reset-ing-filter');
        const applyRecipeFilterBtn = Utils.dom.$('#apply-recipe-filter');
        const resetRecipeFilterBtn = Utils.dom.$('#reset-recipe-filter');

        if (applyIngFilterBtn) applyIngFilterBtn.addEventListener('click', () => this.filterIngredients());
        if (resetIngFilterBtn) resetIngFilterBtn.addEventListener('click', () => this.resetIngredientsFilter());
        if (applyRecipeFilterBtn) applyRecipeFilterBtn.addEventListener('click', () => this.filterRecipes());
        if (resetRecipeFilterBtn) resetRecipeFilterBtn.addEventListener('click', () => this.resetRecipesFilter());

        // 视图切换
        const gridViewBtn = Utils.dom.$('#grid-view');
        const listViewBtn = Utils.dom.$('#list-view');
        
        if (gridViewBtn) gridViewBtn.addEventListener('click', () => this.switchView('grid'));
        if (listViewBtn) listViewBtn.addEventListener('click', () => this.switchView('list'));

        // 排序
        const sortSelect = Utils.dom.$('#sort-results');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSortChange(e.target.value));
        }

        // 主题切换
        const themeToggle = Utils.dom.$('#theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }

        // 收藏夹按钮
        const favoritesBtn = Utils.dom.$('#favorites-btn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', this.showFavorites.bind(this));
        }

        // 键盘快捷键
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // 窗口大小变化
        window.addEventListener('resize', Utils.throttle(() => {
            this.handleResize();
        }, 250));
    }

    /**
     * 切换面板
     */
    switchPanel(panelId) {
        // 更新导航标签状态
        Utils.dom.$$('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        Utils.dom.$(`[data-target="${panelId}"]`).classList.add('active');

        // 切换面板显示
        Utils.dom.$$('.content-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        Utils.dom.$(`#${panelId}`).classList.add('active');

        this.currentView = panelId.replace('-panel', '');

        // 如果切换到分析面板，刷新图表
        if (this.currentView === 'analysis') {
            setTimeout(() => {
                Charts.refresh();
            }, 100);
        }
    }

    /**
     * 处理搜索
     */
    handleSearch() {
        const query = Utils.dom.$('#global-search').value.trim();
        const constitution = Utils.dom.$('#constitution-filter').value;
        const season = Utils.dom.$('#season-filter').value;
        const qi = Utils.dom.$('#qi-filter').value;
        const flavor = Utils.dom.$('#flavor-filter').value;

        const searchParams = {
            query,
            constitution,
            season,
            qi,
            flavor,
            limit: this.pageSize,
            offset: 0
        };

        this.currentPage = 1;
        this.performSearch(searchParams);
    }

    /**
     * 执行搜索
     */
    performSearch(searchParams) {
        try {
            const result = this.searchEngine.search(searchParams);
            this.currentResults = result.results;
            
            this.displaySearchResults(result.results);
            this.updateResultsCount(result.total);
            this.updatePagination(result.total);

            // 如果有搜索词但没有结果，显示建议
            if (searchParams.query && result.total === 0) {
                this.showNoResultsSuggestions(searchParams.query);
            }

        } catch (error) {
            console.error('Search failed:', error);
            Toast.error('搜索失败', '搜索时发生错误，请重试');
        }
    }

    /**
     * 显示搜索结果
     */
    displaySearchResults(results) {
        const container = Utils.dom.$('#search-results');
        if (!container) return;

        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search fa-3x"></i>
                    <h3>未找到相关结果</h3>
                    <p>请尝试调整搜索条件或使用其他关键词</p>
                </div>
            `;
            return;
        }

        results.forEach(item => {
            let card;
            if (item.type === 'ingredient') {
                card = Components.Card.createIngredientCard(item.data);
            } else if (item.type === 'recipe') {
                card = Components.Card.createRecipeCard(item.data);
            }
            
            if (card) {
                container.appendChild(card);
            }
        });
    }

    /**
     * 筛选食材
     */
    filterIngredients() {
        const category = Utils.dom.$('#ing-category').value;
        const subcategory = Utils.dom.$('#ing-subcategory').value;
        const qi = Utils.dom.$('#ing-qi').value;
        const flavor = Utils.dom.$('#ing-flavor').value;
        const meridian = Utils.dom.$('#ing-mer') ? Utils.dom.$('#ing-mer').value : '';

        let filteredIngredients = dataManager.ingredients;

        if (category) {
            filteredIngredients = filteredIngredients.filter(item => 
                item.gate_category === category
            );
        }

        if (subcategory) {
            filteredIngredients = filteredIngredients.filter(item => 
                item.subcategory === subcategory
            );
        }

        if (qi) {
            filteredIngredients = filteredIngredients.filter(item => 
                item.four_qi === qi
            );
        }

        if (flavor) {
            filteredIngredients = filteredIngredients.filter(item => 
                Utils.includesIgnoreCase(item.five_flavors, flavor)
            );
        }

        if (meridian) {
            filteredIngredients = filteredIngredients.filter(item => 
                Utils.includesIgnoreCase(item.meridians, meridian)
            );
        }

        this.displayIngredients(filteredIngredients);
        this.updateIngredientsCount(filteredIngredients.length);
    }

    /**
     * 显示食材列表
     */
    displayIngredients(ingredients) {
        const container = Utils.dom.$('#ingredients-results');
        if (!container) return;

        container.innerHTML = '';

        if (ingredients.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-leaf fa-3x"></i>
                    <h3>未找到符合条件的食材</h3>
                    <p>请调整筛选条件</p>
                </div>
            `;
            return;
        }

        ingredients.forEach(ingredient => {
            const card = Components.Card.createIngredientCard(ingredient);
            container.appendChild(card);
        });
    }

    /**
     * 筛选配方
     */
    filterRecipes() {
        const search = Utils.dom.$('#recipe-search').value.trim();
        const constitution = Utils.dom.$('#recipe-constitution').value;
        const season = Utils.dom.$('#recipe-season').value;
        const hasIngredient = Utils.dom.$('#rec-has-ing') ? Utils.dom.$('#rec-has-ing').value.trim() : '';

        let filteredRecipes = dataManager.recipes;

        if (search) {
            filteredRecipes = filteredRecipes.filter(recipe => 
                Utils.includesIgnoreCase(recipe.title_zh, search) ||
                Utils.includesIgnoreCase(recipe.intent_tags, search)
            );
        }

        if (constitution) {
            filteredRecipes = filteredRecipes.filter(recipe => 
                Utils.includesIgnoreCase(recipe.constitution_tags, constitution)
            );
        }

        if (season) {
            filteredRecipes = filteredRecipes.filter(recipe => 
                Utils.includesIgnoreCase(recipe.seasonality, season)
            );
        }

        if (hasIngredient) {
            const ingredientKeywords = hasIngredient.split(/[,\s\/]+/).filter(k => k.trim());
            filteredRecipes = filteredRecipes.filter(recipe => {
                const ingredients = dataManager.getRecipeIngredients(recipe.title_zh);
                return ingredientKeywords.every(keyword => 
                    ingredients.some(ing => Utils.includesIgnoreCase(ing.name, keyword))
                );
            });
        }

        this.displayRecipes(filteredRecipes);
        this.updateRecipesCount(filteredRecipes.length);
    }

    /**
     * 显示配方列表
     */
    displayRecipes(recipes) {
        const container = Utils.dom.$('#recipes-results');
        if (!container) return;

        container.innerHTML = '';

        if (recipes.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-utensils fa-3x"></i>
                    <h3>未找到符合条件的配方</h3>
                    <p>请调整筛选条件</p>
                </div>
            `;
            return;
        }

        recipes.forEach(recipe => {
            const card = Components.Card.createRecipeCard(recipe);
            container.appendChild(card);
        });
    }

    /**
     * 显示默认数据
     */
    showDefaultData() {
        // 显示部分食材和配方作为示例
        const sampleIngredients = dataManager.ingredients.slice(0, 12);
        const sampleRecipes = dataManager.recipes.slice(0, 8);

        this.displayIngredients(sampleIngredients);
        this.displayRecipes(sampleRecipes);
        
        this.updateIngredientsCount(dataManager.ingredients.length);
        this.updateRecipesCount(dataManager.recipes.length);
    }

    /**
     * 更新计数显示
     */
    updateResultsCount(count) {
        const counter = Utils.dom.$('#results-count');
        if (counter) {
            counter.textContent = `共找到 ${count} 条结果`;
        }
    }

    updateIngredientsCount(count) {
        const counter = Utils.dom.$('#ing-count');
        if (counter) {
            counter.textContent = `共 ${count} 种食材`;
        }
    }

    updateRecipesCount(count) {
        const counter = Utils.dom.$('#recipe-count');
        if (counter) {
            counter.textContent = `共 ${count} 个配方`;
        }
    }

    /**
     * 更新收藏数量
     */
    updateFavoritesCount() {
        const counter = Utils.dom.$('#favorites-count');
        if (counter) {
            counter.textContent = this.favoriteManager ? this.favoriteManager.getFavoritesCount() : 0;
        }
    }

    /**
     * 清空搜索
     */
    clearSearch() {
        Utils.dom.$('#global-search').value = '';
        Utils.dom.$('#constitution-filter').value = '';
        Utils.dom.$('#season-filter').value = '';
        Utils.dom.$('#qi-filter').value = '';
        Utils.dom.$('#flavor-filter').value = '';
        
        Utils.dom.$('#search-results').innerHTML = '';
        this.updateResultsCount(0);
    }

    /**
     * 重置食材筛选
     */
    resetIngredientsFilter() {
        Utils.dom.$('#ing-category').value = '';
        Utils.dom.$('#ing-subcategory').value = '';
        Utils.dom.$('#ing-qi').value = '';
        Utils.dom.$('#ing-flavor').value = '';
        
        const merInput = Utils.dom.$('#ing-mer');
        if (merInput) merInput.value = '';

        this.displayIngredients(dataManager.ingredients.slice(0, 24));
        this.updateIngredientsCount(dataManager.ingredients.length);
    }

    /**
     * 重置配方筛选
     */
    resetRecipesFilter() {
        Utils.dom.$('#recipe-search').value = '';
        Utils.dom.$('#recipe-constitution').value = '';
        Utils.dom.$('#recipe-season').value = '';
        
        const hasIngInput = Utils.dom.$('#rec-has-ing');
        if (hasIngInput) hasIngInput.value = '';

        this.displayRecipes(dataManager.recipes.slice(0, 24));
        this.updateRecipesCount(dataManager.recipes.length);
    }

    /**
     * 切换视图模式
     */
    switchView(view) {
        const gridBtn = Utils.dom.$('#grid-view');
        const listBtn = Utils.dom.$('#list-view');
        const resultsContainer = Utils.dom.$('#search-results');

        if (gridBtn) gridBtn.classList.toggle('active', view === 'grid');
        if (listBtn) listBtn.classList.toggle('active', view === 'list');
        
        if (resultsContainer) {
            resultsContainer.classList.toggle('list-view', view === 'list');
        }
    }

    /**
     * 初始化主题
     */
    initializeTheme() {
        const savedTheme = Utils.storage.get(CONFIG.storage.keys.theme, 'light');
        this.setTheme(savedTheme);
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        
        const themeToggle = Utils.dom.$('#theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        Utils.storage.set(CONFIG.storage.keys.theme, theme);
    }

    /**
     * 显示收藏夹
     */
    showFavorites() {
        if (!this.favoriteManager) return;

        const favorites = this.favoriteManager.getFavorites();
        
        let content = '<div class="favorites-list">';
        
        if (favorites.length === 0) {
            content += `
                <div class="no-favorites">
                    <i class="fas fa-heart fa-3x"></i>
                    <h3>暂无收藏</h3>
                    <p>收藏您感兴趣的食材和配方，方便随时查看</p>
                </div>
            `;
        } else {
            favorites.forEach(item => {
                content += `
                    <div class="favorite-item" data-id="${item.id}" data-type="${item.type}">
                        <div class="favorite-info">
                            <h4>${item.name}</h4>
                            <span class="favorite-type">${item.type === 'ingredient' ? '食材' : '配方'}</span>
                            <span class="favorite-date">${Utils.formatDate(item.addedAt, 'MM-DD HH:mm')}</span>
                        </div>
                        <button class="favorite-remove" data-id="${item.id}" data-type="${item.type}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
        }
        
        content += '</div>';

        Components.Modal.show('我的收藏', content, {
            showFavorite: false,
            showShare: false
        });

        // 绑定收藏项事件
        Utils.dom.$$('.favorite-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('favorite-remove')) return;
                
                const id = item.dataset.id;
                const type = item.dataset.type;
                
                let data;
                if (type === 'ingredient') {
                    data = dataManager.getIngredientByName(id);
                } else {
                    data = dataManager.getRecipeByTitle(id);
                }
                
                if (data) {
                    Components.Modal.hide();
                    Components.Card.showDetail(data, type);
                }
            });
        });

        // 绑定删除按钮事件
        Utils.dom.$$('.favorite-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                
                this.favoriteManager.removeById(id, type);
                this.updateFavoritesCount();
                
                // 重新显示收藏夹
                this.showFavorites();
                
                Toast.success('已移除', '已从收藏夹中移除');
            });
        });
    }

    /**
     * 键盘快捷键处理
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K: 聚焦搜索框
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = Utils.dom.$('#global-search');
            if (searchInput) searchInput.focus();
        }

        // Escape: 关闭模态框
        if (e.key === 'Escape') {
            Components.Modal.hide();
        }
    }

    /**
     * 窗口大小变化处理
     */
    handleResize() {
        // 触发图表重绘
        Charts.handleResize();
    }

    /**
     * 更新分页
     */
    updatePagination(total) {
        const totalPages = Math.ceil(total / this.pageSize);
        const container = Utils.dom.$('#pagination');
        
        if (container && totalPages > 1) {
            Components.Pagination.render(container, this.currentPage, totalPages, this.handlePageChange);
        } else if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * 处理分页变化
     */
    handlePageChange(page) {
        this.currentPage = page;
        // 重新执行搜索或筛选
        if (this.currentView === 'search') {
            this.handleSearch();
        }
    }

    /**
     * 处理排序变化
     */
    handleSortChange(sortBy) {
        // 重新执行搜索，应用新的排序
        this.handleSearch();
    }
}

// 收藏管理器
class FavoriteManager {
    constructor() {
        this.favorites = this.loadFavorites();
    }

    /**
     * 切换收藏状态
     */
    toggle(item, type) {
        const id = item.name_zh || item.title_zh;
        const existingIndex = this.favorites.findIndex(fav => fav.id === id && fav.type === type);

        if (existingIndex >= 0) {
            this.favorites.splice(existingIndex, 1);
            Toast.success('已移除', '已从收藏夹中移除');
        } else {
            if (this.favorites.length >= CONFIG.storage.limits.maxFavorites) {
                Toast.warning('收藏已满', `最多只能收藏 ${CONFIG.storage.limits.maxFavorites} 项`);
                return;
            }

            this.favorites.unshift({
                id: id,
                name: id,
                type: type,
                data: item,
                addedAt: Date.now()
            });
            Toast.success('已收藏', '已添加到收藏夹');
        }

        this.saveFavorites();
        
        // 更新UI中的收藏按钮状态
        this.updateFavoriteButtons(id, type);
        
        // 更新收藏数量显示
        if (window.app) {
            window.app.updateFavoritesCount();
        }
    }

    /**
     * 检查是否已收藏
     */
    isFavorite(id, type) {
        return this.favorites.some(fav => fav.id === id && fav.type === type);
    }

    /**
     * 获取所有收藏
     */
    getFavorites() {
        return this.favorites;
    }

    /**
     * 获取收藏数量
     */
    getFavoritesCount() {
        return this.favorites.length;
    }

    /**
     * 根据ID移除收藏
     */
    removeById(id, type) {
        const index = this.favorites.findIndex(fav => fav.id === id && fav.type === type);
        if (index >= 0) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            this.updateFavoriteButtons(id, type);
        }
    }

    /**
     * 清空收藏
     */
    clear() {
        this.favorites = [];
        this.saveFavorites();
        Toast.success('已清空', '收藏夹已清空');
    }

    /**
     * 更新收藏按钮状态
     */
    updateFavoriteButtons(id, type) {
        const buttons = Utils.dom.$$(`[data-id="${id}"][data-type="${type}"].favorite-btn`);
        const isFavorite = this.isFavorite(id, type);
        
        buttons.forEach(button => {
            button.classList.toggle('active', isFavorite);
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
            }
        });
    }

    /**
     * 保存收藏到本地存储
     */
    saveFavorites() {
        Utils.storage.set(CONFIG.storage.keys.favorites, this.favorites);
    }

    /**
     * 从本地存储加载收藏
     */
    loadFavorites() {
        return Utils.storage.get(CONFIG.storage.keys.favorites, []);
    }

    /**
     * 导出收藏
     */
    export(format = 'json') {
        if (this.favorites.length === 0) {
            Toast.warning('提示', '收藏夹为空，无法导出');
            return;
        }

        const exportData = this.favorites.map(fav => ({
            名称: fav.name,
            类型: fav.type === 'ingredient' ? '食材' : '配方',
            收藏时间: Utils.formatDate(fav.addedAt)
        }));

        const filename = `收藏夹_${Utils.formatDate(new Date(), 'YYYYMMDD_HHmmss')}`;
        
        if (format === 'csv') {
            const csv = Papa.unparse(exportData);
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            this.downloadBlob(blob, `${filename}.csv`);
        } else {
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            this.downloadBlob(blob, `${filename}.json`);
        }

        Toast.success('导出成功', `已导出 ${exportData.length} 项收藏`);
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

// 创建应用实例
const app = new App();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 创建全局收藏管理器实例
const FavoriteManager = window.FavoriteManager || class extends FavoriteManager {};

// 导出到全局
window.app = app;
window.FavoriteManager = new FavoriteManager();