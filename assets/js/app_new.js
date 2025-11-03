/**
 * 主应用程序 - Blue Apron风格版本
 * 负责应用的初始化、事件绑定和核心逻辑
 */

class App {
    constructor() {
        this.searchEngine = null;
        this.favoriteManager = null;
        this.currentView = 'recipes';
        this.currentPage = 1;
        this.pageSize = CONFIG.search.pagination.defaultPageSize;
        this.currentResults = [];
        this.isInitialized = false;
        this.darkMode = false;
        
        // 绑定方法到当前实例
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleViewChange = this.handleViewChange.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.toggleTheme = this.toggleTheme.bind(this);
        this.toggleAdvancedSearch = this.toggleAdvancedSearch.bind(this);
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('Initializing Food Therapy Platform...');
            
            // 显示加载动画
            this.showLoading('正在加载食疗数据库...');

            // 初始化数据管理器
            const dataLoaded = await dataManager.initialize();
            if (!dataLoaded) {
                throw new Error('Failed to load data');
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

            // 加载初始数据
            await this.loadInitialData();

            // 隐藏加载动画
            this.hideLoading();

            // 显示成功消息
            Components.Toast.show('食疗数据库加载完成！', 'success');

            this.isInitialized = true;
            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Application initialization failed:', error);
            this.hideLoading();
            Components.Toast.show('应用初始化失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 初始化UI组件
     */
    initializeUI() {
        // 初始化主题
        this.initializeTheme();
        
        // 初始化导航
        this.initializeNavigation();
        
        // 初始化搜索面板
        this.initializeSearchPanel();
        
        // 初始化筛选器
        this.initializeFilters();
        
        // 初始化分析面板
        this.initializeAnalytics();
    }

    /**
     * 初始化主题
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.darkMode = true;
            document.documentElement.classList.add('dark-theme');
            const themeIcon = document.querySelector('#themeToggle i');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
        }
    }

    /**
     * 初始化导航
     */
    initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.tab === this.currentView) {
                link.classList.add('active');
            }
        });
        
        this.switchView(this.currentView);
    }

    /**
     * 初始化搜索面板
     */
    initializeSearchPanel() {
        // 设置默认搜索标签为激活状态
        const firstTab = document.querySelector('.search-tab[data-search-type="recipes"]');
        if (firstTab) {
            firstTab.classList.add('active');
        }
        
        // 设置默认搜索表单为激活状态
        const firstForm = document.querySelector('#recipes-search');
        if (firstForm) {
            firstForm.classList.add('active');
        }
    }

    /**
     * 初始化筛选器
     */
    async initializeFilters() {
        try {
            const recipes = dataManager.getRecipes();
            const ingredients = dataManager.getIngredients();
            
            // 菜系筛选器
            const cuisineFilter = document.getElementById('cuisineFilter');
            if (cuisineFilter && recipes.length > 0) {
                const cuisines = [...new Set(recipes.map(r => r.cuisine).filter(Boolean))];
                cuisines.forEach(cuisine => {
                    const option = document.createElement('option');
                    option.value = cuisine;
                    option.textContent = cuisine;
                    cuisineFilter.appendChild(option);
                });
            }

            // 食材分类筛选器
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter && ingredients.length > 0) {
                const categories = [...new Set(ingredients.map(i => i.category).filter(Boolean))];
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilter.appendChild(option);
                });
            }

            // 功效筛选器
            const effectFilter = document.getElementById('effectFilter');
            if (effectFilter && ingredients.length > 0) {
                const effects = [...new Set(ingredients.flatMap(i => 
                    (i.effects || '').split(/[,，、]/).map(e => e.trim()).filter(Boolean)
                ))];
                effects.forEach(effect => {
                    const option = document.createElement('option');
                    option.value = effect;
                    option.textContent = effect;
                    effectFilter.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Failed to initialize filters:', error);
        }
    }

    /**
     * 初始化分析面板
     */
    initializeAnalytics() {
        try {
            const recipes = dataManager.getRecipes();
            const ingredients = dataManager.getIngredients();
            const ingredientRelations = dataManager.getIngredientRelations();

            // 更新统计数据
            this.updateElement('totalRecipes', recipes.length);
            this.updateElement('totalIngredients', ingredients.length);
            
            const categories = [...new Set(ingredients.map(i => i.category).filter(Boolean))];
            this.updateElement('totalCategories', categories.length);
            
            const effects = [...new Set(ingredients.flatMap(i => 
                (i.effects || '').split(/[,，、]/).map(e => e.trim()).filter(Boolean)
            ))];
            this.updateElement('totalEffects', effects.length);

            // 初始化图表
            this.initializeCharts();

        } catch (error) {
            console.error('Failed to initialize analytics:', error);
        }
    }

    /**
     * 初始化图表
     */
    initializeCharts() {
        try {
            const ingredients = dataManager.getIngredients();
            
            // 分类分布图表
            const categoryData = {};
            ingredients.forEach(ingredient => {
                const category = ingredient.category || '未分类';
                categoryData[category] = (categoryData[category] || 0) + 1;
            });

            Charts.createCategoryChart('categoryChart', categoryData);

            // 功效分布图表
            const effectData = {};
            ingredients.forEach(ingredient => {
                const effects = (ingredient.effects || '').split(/[,，、]/).map(e => e.trim()).filter(Boolean);
                effects.forEach(effect => {
                    effectData[effect] = (effectData[effect] || 0) + 1;
                });
            });

            // 只显示前10个最常见的功效
            const topEffects = Object.entries(effectData)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

            Charts.createEffectChart('effectChart', topEffects);

        } catch (error) {
            console.error('Failed to initialize charts:', error);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 主题切换
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme);
        }

        // 导航切换
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.dataset.tab;
                if (tab) {
                    this.handleViewChange(tab);
                }
            });
        });

        // 搜索标签切换
        const searchTabs = document.querySelectorAll('.search-tab');
        searchTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const searchType = tab.dataset.searchType;
                if (searchType) {
                    this.switchSearchTab(searchType);
                }
            });
        });

        // 主搜索
        const mainSearchBtn = document.getElementById('mainSearchBtn');
        const mainSearch = document.getElementById('mainSearch');
        if (mainSearchBtn) {
            mainSearchBtn.addEventListener('click', () => {
                const query = mainSearch ? mainSearch.value.trim() : '';
                if (query) {
                    this.performSearch(query, 'all');
                }
            });
        }
        if (mainSearch) {
            mainSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = mainSearch.value.trim();
                    if (query) {
                        this.performSearch(query, 'all');
                    }
                }
            });
        }

        // 快速筛选标签
        const filterTags = document.querySelectorAll('.filter-tag');
        filterTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const filter = tag.dataset.filter;
                if (filter) {
                    this.performSearch(filter, 'effect');
                }
            });
        });

        // 具体搜索按钮
        const searchRecipesBtn = document.getElementById('searchRecipes');
        const searchIngredientsBtn = document.getElementById('searchIngredients');
        const advancedSearchBtn = document.getElementById('advancedSearch');

        if (searchRecipesBtn) {
            searchRecipesBtn.addEventListener('click', () => this.handleRecipeSearch());
        }
        if (searchIngredientsBtn) {
            searchIngredientsBtn.addEventListener('click', () => this.handleIngredientSearch());
        }
        if (advancedSearchBtn) {
            advancedSearchBtn.addEventListener('click', () => this.handleAdvancedSearch());
        }

        // 高级搜索切换
        const toggleAdvancedSearchBtns = document.querySelectorAll('#toggleAdvancedSearch, #toggleAdvancedSearch2');
        toggleAdvancedSearchBtns.forEach(btn => {
            btn.addEventListener('click', this.toggleAdvancedSearch);
        });

        // 排序
        const recipeSortSelect = document.getElementById('recipeSort');
        const ingredientSortSelect = document.getElementById('ingredientSort');
        
        if (recipeSortSelect) {
            recipeSortSelect.addEventListener('change', () => {
                this.sortResults('recipes', recipeSortSelect.value);
            });
        }
        if (ingredientSortSelect) {
            ingredientSortSelect.addEventListener('change', () => {
                this.sortResults('ingredients', ingredientSortSelect.value);
            });
        }

        // 导出数据
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // 清空收藏
        const clearFavoritesBtn = document.getElementById('clearFavorites');
        if (clearFavoritesBtn) {
            clearFavoritesBtn.addEventListener('click', () => this.clearFavorites());
        }

        // 模态框关闭
        const modalClose = document.querySelector('.modal-close');
        const modal = document.getElementById('modal');
        if (modalClose && modal) {
            modalClose.addEventListener('click', () => {
                modal.classList.remove('show');
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        this.darkMode = !this.darkMode;
        const root = document.documentElement;
        const themeIcon = document.querySelector('#themeToggle i');
        
        if (this.darkMode) {
            root.classList.add('dark-theme');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark-theme');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        }
    }

    /**
     * 切换高级搜索面板
     */
    toggleAdvancedSearch() {
        const panel = document.getElementById('advancedSearchPanel');
        if (panel) {
            panel.classList.toggle('show');
        }
    }

    /**
     * 切换搜索标签
     */
    switchSearchTab(searchType) {
        // 更新标签状态
        const tabs = document.querySelectorAll('.search-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.searchType === searchType);
        });

        // 更新表单显示
        const forms = document.querySelectorAll('.search-form');
        forms.forEach(form => {
            form.classList.toggle('active', form.id === `${searchType}-search`);
        });
    }

    /**
     * 切换视图
     */
    switchView(view) {
        this.currentView = view;
        
        // 更新导航状态
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.tab === view);
        });

        // 更新内容显示
        const contentPages = document.querySelectorAll('.content-page');
        contentPages.forEach(page => {
            page.classList.toggle('active', page.id === `${view}-content`);
        });

        // 加载对应数据
        this.loadViewData(view);
    }

    /**
     * 视图变化处理
     */
    handleViewChange(view) {
        this.switchView(view);
    }

    /**
     * 加载视图数据
     */
    async loadViewData(view) {
        try {
            switch (view) {
                case 'recipes':
                    await this.loadRecipes();
                    break;
                case 'ingredients':
                    await this.loadIngredients();
                    break;
                case 'favorites':
                    await this.loadFavorites();
                    break;
                case 'analytics':
                    // 分析数据已在初始化时加载
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${view} data:`, error);
            Components.Toast.show('数据加载失败', 'error');
        }
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        await this.loadRecipes();
    }

    /**
     * 加载菜谱
     */
    async loadRecipes(filters = {}) {
        const recipes = dataManager.getRecipes();
        const filteredRecipes = this.applyFilters(recipes, filters);
        const paginatedRecipes = this.paginate(filteredRecipes, this.currentPage, this.pageSize);
        
        this.currentResults = filteredRecipes;
        this.renderRecipes(paginatedRecipes);
        this.renderPagination('recipePagination', filteredRecipes.length);
    }

    /**
     * 加载食材
     */
    async loadIngredients(filters = {}) {
        const ingredients = dataManager.getIngredients();
        const filteredIngredients = this.applyFilters(ingredients, filters);
        const paginatedIngredients = this.paginate(filteredIngredients, this.currentPage, this.pageSize);
        
        this.currentResults = filteredIngredients;
        this.renderIngredients(paginatedIngredients);
        this.renderPagination('ingredientPagination', filteredIngredients.length);
    }

    /**
     * 加载收藏
     */
    async loadFavorites() {
        const favorites = this.favoriteManager.getFavorites();
        this.renderFavorites(favorites);
    }

    /**
     * 渲染菜谱
     */
    renderRecipes(recipes) {
        const container = document.getElementById('recipeResults');
        if (!container) return;

        if (recipes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <h3>暂无菜谱</h3>
                    <p>试试调整搜索条件或筛选器</p>
                </div>
            `;
            return;
        }

        const html = recipes.map(recipe => this.createRecipeCard(recipe)).join('');
        container.innerHTML = html;

        // 绑定卡片事件
        this.bindCardEvents(container);
    }

    /**
     * 渲染食材
     */
    renderIngredients(ingredients) {
        const container = document.getElementById('ingredientResults');
        if (!container) return;

        if (ingredients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-leaf"></i>
                    </div>
                    <h3>暂无食材</h3>
                    <p>试试调整搜索条件或筛选器</p>
                </div>
            `;
            return;
        }

        const html = ingredients.map(ingredient => this.createIngredientCard(ingredient)).join('');
        container.innerHTML = html;

        // 绑定卡片事件
        this.bindCardEvents(container);
    }

    /**
     * 创建菜谱卡片
     */
    createRecipeCard(recipe) {
        const isFavorite = this.favoriteManager.isFavorite('recipe', recipe.id || recipe.name);
        
        return `
            <div class="recipe-card" data-id="${recipe.id || recipe.name}" data-type="recipe">
                <div class="card-image">
                    <i class="fas fa-utensils"></i>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${recipe.name || '未知菜谱'}</h3>
                    <div class="card-meta">
                        ${recipe.cuisine ? `<span class="meta-tag"><i class="fas fa-map-marker-alt"></i> ${recipe.cuisine}</span>` : ''}
                        ${recipe.difficulty ? `<span class="meta-tag"><i class="fas fa-chart-bar"></i> ${recipe.difficulty}</span>` : ''}
                        ${recipe.time ? `<span class="meta-tag"><i class="fas fa-clock"></i> ${recipe.time}分钟</span>` : ''}
                    </div>
                    <p class="card-description">${recipe.description || recipe.effects || '暂无描述'}</p>
                    <div class="card-actions">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${recipe.id || recipe.name}" data-type="recipe">
                            <i class="fas fa-heart"></i>
                        </button>
                        <a href="#" class="view-btn" data-id="${recipe.id || recipe.name}" data-type="recipe">查看详情</a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建食材卡片
     */
    createIngredientCard(ingredient) {
        const isFavorite = this.favoriteManager.isFavorite('ingredient', ingredient.id || ingredient.name);
        
        return `
            <div class="ingredient-card" data-id="${ingredient.id || ingredient.name}" data-type="ingredient">
                <div class="card-image">
                    <i class="fas fa-leaf"></i>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${ingredient.name || '未知食材'}</h3>
                    <div class="card-meta">
                        ${ingredient.category ? `<span class="meta-tag"><i class="fas fa-tag"></i> ${ingredient.category}</span>` : ''}
                        ${ingredient.nature ? `<span class="meta-tag"><i class="fas fa-yin-yang"></i> ${ingredient.nature}</span>` : ''}
                        ${ingredient.taste ? `<span class="meta-tag"><i class="fas fa-smile"></i> ${ingredient.taste}</span>` : ''}
                    </div>
                    <p class="card-description">${ingredient.effects || ingredient.description || '暂无描述'}</p>
                    <div class="card-actions">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${ingredient.id || ingredient.name}" data-type="ingredient">
                            <i class="fas fa-heart"></i>
                        </button>
                        <a href="#" class="view-btn" data-id="${ingredient.id || ingredient.name}" data-type="ingredient">查看详情</a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定卡片事件
     */
    bindCardEvents(container) {
        // 收藏按钮
        const favoriteButtons = container.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                this.toggleFavorite(id, type, btn);
            });
        });

        // 查看详情按钮
        const viewButtons = container.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                this.showItemDetails(id, type);
            });
        });

        // 卡片点击
        const cards = container.querySelectorAll('.recipe-card, .ingredient-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const type = card.dataset.type;
                this.showItemDetails(id, type);
            });
        });
    }

    /**
     * 切换收藏状态
     */
    toggleFavorite(id, type, button) {
        const isCurrentlyFavorite = button.classList.contains('active');
        
        if (isCurrentlyFavorite) {
            this.favoriteManager.removeFavorite(type, id);
            button.classList.remove('active');
            Components.Toast.show('已取消收藏', 'info');
        } else {
            // 获取项目数据
            let item;
            if (type === 'recipe') {
                item = dataManager.getRecipes().find(r => (r.id || r.name) === id);
            } else {
                item = dataManager.getIngredients().find(i => (i.id || i.name) === id);
            }
            
            if (item) {
                this.favoriteManager.addFavorite(type, id, item);
                button.classList.add('active');
                Components.Toast.show('已添加到收藏', 'success');
            }
        }
    }

    /**
     * 显示项目详情
     */
    showItemDetails(id, type) {
        let item;
        if (type === 'recipe') {
            item = dataManager.getRecipes().find(r => (r.id || r.name) === id);
        } else {
            item = dataManager.getIngredients().find(i => (i.id || i.name) === id);
        }

        if (!item) {
            Components.Toast.show('未找到相关信息', 'error');
            return;
        }

        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        if (modal && modalBody) {
            modalBody.innerHTML = this.createItemDetailsHTML(item, type);
            modal.classList.add('show');
        }
    }

    /**
     * 创建项目详情HTML
     */
    createItemDetailsHTML(item, type) {
        if (type === 'recipe') {
            return `
                <div class="item-details">
                    <div class="details-header">
                        <h2>${item.name || '未知菜谱'}</h2>
                        <div class="details-meta">
                            ${item.cuisine ? `<span class="meta-tag"><i class="fas fa-map-marker-alt"></i> ${item.cuisine}</span>` : ''}
                            ${item.difficulty ? `<span class="meta-tag"><i class="fas fa-chart-bar"></i> ${item.difficulty}</span>` : ''}
                            ${item.time ? `<span class="meta-tag"><i class="fas fa-clock"></i> ${item.time}分钟</span>` : ''}
                        </div>
                    </div>
                    <div class="details-content">
                        ${item.description ? `<div class="details-section"><h3>菜谱描述</h3><p>${item.description}</p></div>` : ''}
                        ${item.effects ? `<div class="details-section"><h3>食疗功效</h3><p>${item.effects}</p></div>` : ''}
                        ${item.ingredients ? `<div class="details-section"><h3>主要食材</h3><p>${item.ingredients}</p></div>` : ''}
                        ${item.method ? `<div class="details-section"><h3>制作方法</h3><p>${item.method}</p></div>` : ''}
                        ${item.contraindications ? `<div class="details-section"><h3>使用禁忌</h3><p>${item.contraindications}</p></div>` : ''}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="item-details">
                    <div class="details-header">
                        <h2>${item.name || '未知食材'}</h2>
                        <div class="details-meta">
                            ${item.category ? `<span class="meta-tag"><i class="fas fa-tag"></i> ${item.category}</span>` : ''}
                            ${item.nature ? `<span class="meta-tag"><i class="fas fa-yin-yang"></i> ${item.nature}</span>` : ''}
                            ${item.taste ? `<span class="meta-tag"><i class="fas fa-smile"></i> ${item.taste}</span>` : ''}
                        </div>
                    </div>
                    <div class="details-content">
                        ${item.description ? `<div class="details-section"><h3>食材描述</h3><p>${item.description}</p></div>` : ''}
                        ${item.effects ? `<div class="details-section"><h3>食疗功效</h3><p>${item.effects}</p></div>` : ''}
                        ${item.suitable_people ? `<div class="details-section"><h3>适用人群</h3><p>${item.suitable_people}</p></div>` : ''}
                        ${item.contraindications ? `<div class="details-section"><h3>使用禁忌</h3><p>${item.contraindications}</p></div>` : ''}
                        ${item.usage ? `<div class="details-section"><h3>用法用量</h3><p>${item.usage}</p></div>` : ''}
                    </div>
                </div>
            `;
        }
    }

    /**
     * 执行搜索
     */
    async performSearch(query, type = 'all') {
        if (!query.trim()) return;

        try {
            this.showLoading('正在搜索...');
            
            let results = [];
            
            if (type === 'all' || type === 'recipe') {
                const recipeResults = this.searchEngine.searchRecipes(query);
                results = [...results, ...recipeResults.map(r => ({ ...r, type: 'recipe' }))];
            }
            
            if (type === 'all' || type === 'ingredient') {
                const ingredientResults = this.searchEngine.searchIngredients(query);
                results = [...results, ...ingredientResults.map(i => ({ ...i, type: 'ingredient' }))];
            }
            
            if (type === 'effect') {
                // 按功效搜索
                const ingredientResults = this.searchEngine.searchIngredientsByEffect(query);
                results = [...results, ...ingredientResults.map(i => ({ ...i, type: 'ingredient' }))];
            }

            this.hideLoading();
            
            if (results.length === 0) {
                Components.Toast.show('未找到相关结果', 'info');
                return;
            }

            // 切换到合适的视图并显示结果
            if (type === 'recipe' || (type === 'all' && results.every(r => r.type === 'recipe'))) {
                this.switchView('recipes');
                this.renderRecipes(results.filter(r => r.type === 'recipe'));
            } else if (type === 'ingredient' || type === 'effect' || results.every(r => r.type === 'ingredient')) {
                this.switchView('ingredients');
                this.renderIngredients(results.filter(r => r.type === 'ingredient'));
            } else {
                // 混合结果，显示在菜谱视图
                this.switchView('recipes');
                this.renderMixedResults(results);
            }

            Components.Toast.show(`找到 ${results.length} 个相关结果`, 'success');

        } catch (error) {
            console.error('Search failed:', error);
            this.hideLoading();
            Components.Toast.show('搜索失败，请重试', 'error');
        }
    }

    /**
     * 处理菜谱搜索
     */
    handleRecipeSearch() {
        const query = document.getElementById('recipeSearch')?.value.trim();
        const cuisine = document.getElementById('cuisineFilter')?.value;
        const difficulty = document.getElementById('difficultyFilter')?.value;
        const time = document.getElementById('timeFilter')?.value;

        const filters = { cuisine, difficulty, time };
        
        if (query) {
            this.performSearch(query, 'recipe');
        } else {
            this.loadRecipes(filters);
            this.switchView('recipes');
        }
    }

    /**
     * 处理食材搜索
     */
    handleIngredientSearch() {
        const query = document.getElementById('ingredientSearch')?.value.trim();
        const category = document.getElementById('categoryFilter')?.value;
        const effect = document.getElementById('effectFilter')?.value;
        const season = document.getElementById('seasonFilter')?.value;

        const filters = { category, effect, season };
        
        if (query) {
            this.performSearch(query, 'ingredient');
        } else {
            this.loadIngredients(filters);
            this.switchView('ingredients');
        }
    }

    /**
     * 处理高级搜索
     */
    handleAdvancedSearch() {
        const constitutions = Array.from(document.querySelectorAll('#advanced-search input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        const symptoms = document.getElementById('symptomsInput')?.value.trim();
        const contraindications = document.getElementById('contraindicationsInput')?.value.trim();

        // 构建搜索查询
        const searchTerms = [];
        if (constitutions.length > 0) {
            searchTerms.push(...constitutions);
        }
        if (symptoms) {
            searchTerms.push(symptoms);
        }

        if (searchTerms.length === 0) {
            Components.Toast.show('请选择体质类型或输入症状', 'warning');
            return;
        }

        const query = searchTerms.join(' ');
        this.performSearch(query, 'all');
    }

    /**
     * 应用筛选器
     */
    applyFilters(items, filters) {
        return items.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (value && item[key] && !item[key].includes(value)) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * 分页
     */
    paginate(items, page, pageSize) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return items.slice(start, end);
    }

    /**
     * 渲染分页
     */
    renderPagination(containerId, totalItems) {
        const container = document.getElementById(containerId);
        if (!container || totalItems <= this.pageSize) {
            if (container) container.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(totalItems / this.pageSize);
        const currentPage = this.currentPage;

        let html = `
            <button ${currentPage <= 1 ? 'disabled' : ''} onclick="app.changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `
                    <button class="${i === currentPage ? 'active' : ''}" onclick="app.changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += '<span>...</span>';
            }
        }

        html += `
            <button ${currentPage >= totalPages ? 'disabled' : ''} onclick="app.changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = html;
    }

    /**
     * 改变页面
     */
    changePage(page) {
        this.currentPage = page;
        this.loadViewData(this.currentView);
    }

    /**
     * 排序结果
     */
    sortResults(type, sortBy) {
        if (this.currentResults.length === 0) return;

        this.currentResults.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'difficulty':
                    const difficultyOrder = { '简单': 1, '中等': 2, '困难': 3 };
                    return (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
                case 'time':
                    return (parseInt(a.time) || 0) - (parseInt(b.time) || 0);
                case 'category':
                    return (a.category || '').localeCompare(b.category || '');
                case 'effect':
                    return (a.effects || '').localeCompare(b.effects || '');
                default:
                    return 0;
            }
        });

        // 重新渲染
        this.currentPage = 1;
        const paginatedResults = this.paginate(this.currentResults, this.currentPage, this.pageSize);
        
        if (type === 'recipes') {
            this.renderRecipes(paginatedResults);
            this.renderPagination('recipePagination', this.currentResults.length);
        } else {
            this.renderIngredients(paginatedResults);
            this.renderPagination('ingredientPagination', this.currentResults.length);
        }
    }

    /**
     * 导出数据
     */
    exportData() {
        try {
            const data = {
                recipes: dataManager.getRecipes(),
                ingredients: dataManager.getIngredients(),
                favorites: this.favoriteManager.getFavorites(),
                exportTime: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `食疗数据库_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Components.Toast.show('数据导出成功', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            Components.Toast.show('数据导出失败', 'error');
        }
    }

    /**
     * 清空收藏
     */
    clearFavorites() {
        if (confirm('确定要清空所有收藏吗？')) {
            this.favoriteManager.clearFavorites();
            this.loadFavorites();
            Components.Toast.show('收藏已清空', 'info');
        }
    }

    /**
     * 渲染收藏
     */
    renderFavorites(favorites) {
        const container = document.getElementById('favoritesResults');
        if (!container) return;

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3>还没有收藏内容</h3>
                    <p>在浏览菜谱或食材时点击收藏按钮，将它们添加到这里</p>
                </div>
            `;
            return;
        }

        const html = favorites.map(favorite => {
            if (favorite.type === 'recipe') {
                return this.createRecipeCard(favorite.data);
            } else {
                return this.createIngredientCard(favorite.data);
            }
        }).join('');

        container.innerHTML = html;
        this.bindCardEvents(container);
    }

    /**
     * 显示加载状态
     */
    showLoading(message = '正在加载...') {
        const loadingOverlay = document.getElementById('loadingIndicator');
        if (loadingOverlay) {
            const messageElement = loadingOverlay.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingIndicator');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * 更新元素内容
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * 处理搜索（兼容原有接口）
     */
    handleSearch(query, type) {
        return this.performSearch(query, type);
    }

    /**
     * 处理筛选变化（兼容原有接口）
     */
    handleFilterChange() {
        this.loadViewData(this.currentView);
    }

    /**
     * 处理页面变化（兼容原有接口）
     */
    handlePageChange(page) {
        this.changePage(page);
    }
}

// 收藏管理器
class FavoriteManager {
    constructor() {
        this.favorites = this.loadFavorites();
    }

    loadFavorites() {
        try {
            const stored = localStorage.getItem('food_therapy_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load favorites:', error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('food_therapy_favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }

    addFavorite(type, id, data) {
        const existing = this.favorites.find(f => f.type === type && f.id === id);
        if (!existing) {
            this.favorites.push({
                type,
                id,
                data,
                addedAt: new Date().toISOString()
            });
            this.saveFavorites();
        }
    }

    removeFavorite(type, id) {
        this.favorites = this.favorites.filter(f => !(f.type === type && f.id === id));
        this.saveFavorites();
    }

    isFavorite(type, id) {
        return this.favorites.some(f => f.type === type && f.id === id);
    }

    getFavorites() {
        return this.favorites;
    }

    clearFavorites() {
        this.favorites = [];
        this.saveFavorites();
    }
}

// 初始化应用
const app = new App();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    Components.Toast.show('发生了一个错误，请刷新页面重试', 'error');
});

// 全局未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    Components.Toast.show('操作失败，请重试', 'error');
});

// 导出应用实例供全局使用
window.app = app;