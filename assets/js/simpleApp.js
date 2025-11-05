/**
 * 简化的应用主入口文件
 */

class SimpleApp {
    constructor() {
        this.currentPanel = 'search-panel';
        this.isInitialized = false;
        this.currentResults = [];
        this.currentPage = 1;
        this.pageSize = 20;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('Initializing Simple App...');
            
            // 初始化数据管理器
            const success = await dataManager.initialize();
            if (!success) {
                console.error('Failed to initialize data manager');
                return;
            }

            // 初始化UI
            this.initializeUI();
            this.bindEvents();
            this.populateFilters();
            this.updateStats();
            
            this.isInitialized = true;
            console.log('Simple App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        // 初始化标签页
        this.initTabs();
        
        // 初始化搜索面板
        this.initSearchPanel();
        
        // 初始化结果显示
        this.updateResultsCount(0);
        
        console.log('UI initialized');
    }

    /**
     * 初始化标签页
     */
    initTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        const panels = document.querySelectorAll('.content-panel');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;
                
                // 更新标签页状态
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 更新面板状态
                panels.forEach(p => p.classList.remove('active'));
                const targetPanel = document.getElementById(target);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    this.currentPanel = target;
                    
                    // 根据面板类型初始化数据
                    this.initializePanelData(target);
                }
            });
        });
    }

    /**
     * 初始化面板数据
     */
    initializePanelData(panelId) {
        switch(panelId) {
            case 'ingredients-panel':
                this.filterIngredients(); // 显示所有食材
                break;
            case 'recipes-panel':
                this.filterRecipes(); // 显示所有配方
                break;
            case 'herbs-panel':
                this.filterHerbs(); // 显示所有药材
                break;
            case 'seasonings-panel':
                this.filterSeasonings(); // 显示所有调味料
                break;
        }
    }

    /**
     * 初始化搜索面板
     */
    initSearchPanel() {
        const searchInput = document.getElementById('global-search');
        const searchBtn = document.getElementById('search-btn');
        const advancedBtn = document.getElementById('advanced-search');
        const clearBtn = document.getElementById('clear-search');
        
        if (searchInput) {
            // 搜索输入防抖
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch();
                }, 300);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (advancedBtn) {
            advancedBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSearch());
        }
        
        // 显示常用食材
        this.displayPopularIngredients();
    }

    /**
     * 显示常用食材
     */
    displayPopularIngredients() {
        console.log('Displaying popular ingredients...');
        const popularIngredients = [
            '虾', '羊肉', '牛肉', '猪肉', '鸡肉', '鸡蛋',
            '白菜', '土豆', '西红柿', '西兰花', '胡萝卜', '菠菜',
            '大米', '小米', '面粉', '豆腐', '牛奶', '蜂蜜'
        ];
        
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) {
            console.error('Results container not found!');
            return;
        }
        console.log('Results container found:', resultsContainer);
        
        const ingredientsHtml = popularIngredients.map(name => {
            const ingredient = dataManager.ingredients.find(item => item.name_zh === name);
            if (ingredient) {
                return this.createResultCard(ingredient);
            } else {
                // 如果没找到，创建一个基本卡片
                return this.createBasicIngredientCard(name);
            }
        }).join('');
        
        // 检查是否已经有标题，如果没有则添加
        const existingTitle = document.querySelector('.popular-ingredients-section');
        if (!existingTitle) {
            const titleSection = document.createElement('div');
            titleSection.className = 'popular-ingredients-section';
            titleSection.innerHTML = `
                <h3 class="section-title">
                    <i class="fas fa-star"></i>
                    常用食材推荐
                </h3>
            `;
            resultsContainer.parentNode.insertBefore(titleSection, resultsContainer);
        }
        
        resultsContainer.innerHTML = ingredientsHtml;
        
        // 确保容器使用网格布局
        resultsContainer.classList.add('results-grid');
        resultsContainer.classList.remove('list-view');
        console.log('Applied results-grid class to container');
    }

    /**
     * 创建基本食材卡片（当数据库中找不到时的备用）
     */
    createBasicIngredientCard(name) {
        return `
            <div class="result-card" data-type="ingredient" data-name="${name}">
                <div class="card-header">
                    <h3 class="card-title">${name}</h3>
                    <span class="card-type">食材</span>
                </div>
                <div class="card-content">
                    <p class="card-category">
                        <i class="fas fa-tag"></i>
                        常用食材
                    </p>
                    <p class="card-description">暂无详细信息</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-outline btn-sm" onclick="app.showDetails('${name}', 'ingredient')">
                        <i class="fas fa-eye"></i>
                        查看详情
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="app.toggleFavorite('${name}')">
                        <i class="fas fa-heart"></i>
                        收藏
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 主题切换
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // 视图切换
        const gridView = document.getElementById('grid-view');
        const listView = document.getElementById('list-view');
        
        if (gridView) {
            gridView.addEventListener('click', () => this.setViewMode('grid'));
        }
        
        if (listView) {
            listView.addEventListener('click', () => this.setViewMode('list'));
        }
        
        // 排序
        const sortSelect = document.getElementById('sort-results');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.sortResults());
        }
        
        // 过滤器变化
        const filters = ['constitution-filter', 'season-filter', 'qi-filter', 'flavor-filter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.performSearch());
            }
        });

        // 药材库过滤器
        const herbsFilters = ['herbs-category', 'herbs-constitution', 'herbs-nature', 'herbs-taste'];
        herbsFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterHerbs());
            }
        });

        // 调味库过滤器
        const seasoningsFilters = ['seasonings-category', 'seasonings-origin', 'seasonings-taste', 'seasonings-usage'];
        seasoningsFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterSeasonings());
            }
        });

        // 食材库过滤器
        const ingredientsFilters = ['ing-category', 'ing-constitution', 'ing-nature', 'ing-flavor'];
        ingredientsFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterIngredients());
            }
        });

        // 配方库过滤器  
        const recipesFilters = ['recipe-category', 'recipe-constitution', 'recipe-season', 'recipe-difficulty'];
        recipesFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterRecipes());
            }
        });
        
        console.log('Events bound');
    }

    /**
     * 填充过滤器选项
     */
    populateFilters() {
        try {
            // 体质过滤器
            const constitutionFilter = document.getElementById('constitution-filter');
            if (constitutionFilter) {
                const constitutions = dataManager.getUniqueConstitutions();
                constitutions.forEach(constitution => {
                    const option = document.createElement('option');
                    option.value = constitution;
                    option.textContent = constitution + '质';
                    constitutionFilter.appendChild(option);
                });
            }
            
            // 配方体质过滤器
            const recipeConstitutionFilter = document.getElementById('recipe-constitution');
            if (recipeConstitutionFilter) {
                const constitutions = dataManager.getUniqueConstitutions();
                constitutions.forEach(constitution => {
                    const option = document.createElement('option');
                    option.value = constitution;
                    option.textContent = constitution + '质';
                    recipeConstitutionFilter.appendChild(option);
                });
            }
            
            // 食材分类过滤器
            const categoryFilter = document.getElementById('ing-category');
            if (categoryFilter) {
                const categories = dataManager.getUniqueCategories();
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilter.appendChild(option);
                });
            }
            
            console.log('Filters populated');
        } catch (error) {
            console.error('Error populating filters:', error);
        }
    }

    /**
     * 执行搜索
     */
    performSearch() {
        try {
            const query = document.getElementById('global-search')?.value || '';
            const filters = this.getActiveFilters();
            
            console.log('Performing search:', query, filters);
            
            this.currentResults = dataManager.search(query, filters);
            this.currentPage = 1;
            
            this.displayResults();
            this.updateResultsCount(this.currentResults.length);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('搜索失败，请重试', 'error');
        }
    }

    /**
     * 获取当前激活的过滤器
     */
    getActiveFilters() {
        const filters = {};
        
        const constitution = document.getElementById('constitution-filter')?.value;
        if (constitution) filters.constitution = constitution;
        
        const season = document.getElementById('season-filter')?.value;
        if (season) filters.season = season;
        
        const qi = document.getElementById('qi-filter')?.value;
        if (qi) filters.qi = qi;
        
        const category = document.getElementById('ing-category')?.value;
        if (category) filters.category = category;
        
        return filters;
    }

    /**
     * 显示搜索结果
     */
    displayResults() {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        if (this.currentResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3 style="color: #666;">未找到相关结果</h3>
                    <p style="color: #999;">请尝试使用其他关键词或调整筛选条件</p>
                </div>
            `;
            resultsContainer.classList.remove('results-grid');
            resultsContainer.classList.add('no-results-container');
            return;
        }
        
        // 分页显示
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageResults = this.currentResults.slice(startIndex, endIndex);
        
        const html = pageResults.map(item => this.createResultCard(item)).join('');
        resultsContainer.innerHTML = html;
        
        // 确保容器使用网格布局
        resultsContainer.classList.add('results-grid');
        resultsContainer.classList.remove('list-view');
        
        // 绑定卡片点击事件
        this.bindResultCards();
    }

    /**
     * 创建结果卡片
     */
    createResultCard(item) {
        const isRecipe = item.title_zh !== undefined;
        const title = isRecipe ? item.title_zh : item.name_zh;
        const type = isRecipe ? '配方' : '食材';
        const category = isRecipe ? '食疗配方' : (item.gate_category || '未分类');
        const description = isRecipe ? item.intent_tags : item.primary_functions;
        
        // 处理体质标签，避免重复显示
        let constitutions = '';
        if (isRecipe) {
            constitutions = item.constitution_tags || '';
        } else {
            // 对于食材，合并 constitutions_suitable 和 constitution_tags，去重
            const constitutionSources = [
                item.constitutions_suitable || '',
                item.constitution_tags || ''
            ].filter(Boolean);
            
            if (constitutionSources.length > 0) {
                const allConstitutions = constitutionSources.join(',').split(',')
                    .map(c => c.trim())
                    .filter(c => c && c !== '')
                    .filter((c, index, arr) => arr.indexOf(c) === index); // 去重
                constitutions = allConstitutions.join(',');
            }
        }
        
        const seasons = item.seasonality || '';
        
        // 获取相宜相克信息（仅对食材显示）
        let compatibilityHtml = '';
        if (!isRecipe && item.pairings_good) {
            const goodPairings = item.pairings_good.split(',').slice(0, 3).join('、');
            compatibilityHtml += `
                <div class="card-compatibility">
                    <span class="compatibility-label">相宜：</span>
                    <span class="pairing-good-preview">${goodPairings}</span>
                </div>
            `;
        }
        if (!isRecipe && item.pairings_bad) {
            const badPairings = item.pairings_bad.split(',').slice(0, 3).join('、');
            compatibilityHtml += `
                <div class="card-compatibility">
                    <span class="compatibility-label">相克：</span>
                    <span class="pairing-bad-preview">${badPairings}</span>
                </div>
            `;
        }
        
        return `
            <div class="result-card" data-type="${isRecipe ? 'recipe' : 'ingredient'}" data-name="${title}" onclick="app.showDetails('${title}', '${isRecipe ? 'recipe' : 'ingredient'}')">
                <div class="card-header">
                    <h3 class="card-title">${title}</h3>
                    <span class="card-type">${type}</span>
                </div>
                <div class="card-content">
                    <p class="card-category">
                        <i class="fas fa-tag"></i>
                        ${category}
                    </p>
                    ${description ? `<p class="card-description">${description}</p>` : ''}
                    ${constitutions ? `
                        <p class="card-constitutions">
                            <i class="fas fa-user"></i>
                            适用体质：${constitutions}
                        </p>
                    ` : ''}
                    ${seasons ? `
                        <p class="card-seasons">
                            <i class="fas fa-calendar"></i>
                            适用季节：${seasons}
                        </p>
                    ` : ''}
                    ${compatibilityHtml}
                </div>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-outline btn-sm" onclick="app.toggleFavorite('${title}')">
                        <i class="fas fa-heart"></i>
                        收藏
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 绑定结果卡片事件
     */
    bindResultCards() {
        const cards = document.querySelectorAll('.result-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.card-actions')) return;
                
                const name = card.dataset.name;
                const type = card.dataset.type;
                this.showDetails(name, type);
            });
        });
    }

    /**
     * 显示详情
     */
    showDetails(name, type) {
        let item;
        let content = '';
        
        // 存储当前详情信息，用于返回功能
        this.currentDetailInfo = { name, type };
        
        if (type === 'recipe') {
            item = dataManager.recipes.find(r => r.title_zh === name);
            if (item) {
                const ingredients = dataManager.getRecipeIngredients(name);
                const ingredientsList = ingredients.map(ing => 
                    `<div class="ingredient-item">
                        <span class="ingredient-name">${ing.ingredient_name_zh}</span>
                        <span class="ingredient-amount">${ing.amount}</span>
                        ${ing.note ? `<span class="ingredient-note">${ing.note}</span>` : ''}
                    </div>`
                ).join('');
                
                content = `
                    <div class="detail-header">
                        <div class="detail-badge recipe-badge">食疗配方</div>
                        <div class="detail-tags">
                            ${item.intent_tags ? item.intent_tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : ''}
                        </div>
                    </div>
                    
                    <div class="detail-grid">
                        <div class="detail-section">
                            <div class="section-header">
                                <i class="fas fa-user-md"></i>
                                <h4>适用体质</h4>
                            </div>
                            <div class="constitution-tags">
                                ${item.constitution_tags ? item.constitution_tags.split(',').map(constitution => `<span class="constitution-tag">${constitution.trim()}</span>`).join('') : '<span class="no-data">暂无信息</span>'}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <div class="section-header">
                                <i class="fas fa-calendar-alt"></i>
                                <h4>适用季节</h4>
                            </div>
                            <p class="season-info">${item.seasonality || '四季皆宜'}</p>
                        </div>
                    </div>
                    
                    <div class="detail-section ingredients-section">
                        <div class="section-header">
                            <i class="fas fa-list"></i>
                            <h4>配料清单</h4>
                        </div>
                        <div class="ingredients-grid">
                            ${ingredientsList || '<div class="no-data">暂无配料信息</div>'}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <div class="section-header">
                            <i class="fas fa-cogs"></i>
                            <h4>制作方法</h4>
                        </div>
                        <div class="method-content">${item.method || '暂无信息'}</div>
                    </div>
                    
                    <div class="detail-section">
                        <div class="section-header">
                            <i class="fas fa-prescription-bottle"></i>
                            <h4>用法用量</h4>
                        </div>
                        <div class="usage-content">${item.usage || '暂无信息'}</div>
                    </div>
                    
                    ${item.cautions ? `
                        <div class="detail-section warning-section">
                            <div class="section-header">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h4>注意事项</h4>
                            </div>
                            <div class="warning-content">${item.cautions}</div>
                        </div>
                    ` : ''}
                `;
            }
        } else {
            item = dataManager.ingredients.find(i => i.name_zh === name);
            if (item) {
                const relatedRecipes = dataManager.getIngredientRecipes(name);
                const recipesList = relatedRecipes.map(recipe => 
                    `<div class="recipe-link" onclick="app.showRelatedRecipe('${recipe.title_zh}', 'recipe')">${recipe.title_zh}</div>`
                ).join('');
                
                // 相宜相克信息
                let compatibilitySection = '';
                if (item.pairings_good || item.pairings_bad) {
                    compatibilitySection = `
                        <div class="detail-section compatibility-section">
                            <div class="section-header">
                                <i class="fas fa-balance-scale"></i>
                                <h4>相宜相克</h4>
                            </div>
                            <div class="compatibility-grid">
                                ${item.pairings_good ? `
                                    <div class="compatibility-item good">
                                        <div class="compatibility-label">相宜</div>
                                        <div class="compatibility-list">
                                            ${item.pairings_good.split(',').map(item => `<span class="compatibility-tag good">${item.trim()}</span>`).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                ${item.pairings_bad ? `
                                    <div class="compatibility-item bad">
                                        <div class="compatibility-label">相克</div>
                                        <div class="compatibility-list">
                                            ${item.pairings_bad.split(',').map(item => `<span class="compatibility-tag bad">${item.trim()}</span>`).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
                
                content = `
                    <div class="detail-header">
                        <div class="detail-badge ingredient-badge">食材</div>
                        <div class="category-info">${item.gate_category || '未分类'}</div>
                    </div>
                    
                    <div class="detail-grid">
                        <div class="detail-section">
                            <div class="section-header">
                                <i class="fas fa-thermometer-half"></i>
                                <h4>四气五味</h4>
                            </div>
                            <div class="qi-flavor-tags">
                                <span class="qi-tag">${item.four_qi || '未知'}</span>
                                <span class="flavor-tag">${item.five_flavors || '未知'}</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <div class="section-header">
                                <i class="fas fa-route"></i>
                                <h4>归经</h4>
                            </div>
                            <div class="meridian-info">${item.meridians || '暂无信息'}</div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <div class="section-header">
                            <i class="fas fa-star"></i>
                            <h4>主要功能</h4>
                        </div>
                        <div class="function-content">${item.primary_functions || '暂无信息'}</div>
                    </div>
                    
                    <div class="detail-section">
                        <div class="section-header">
                            <i class="fas fa-user-md"></i>
                            <h4>适用体质</h4>
                        </div>
                        <div class="constitution-tags">
                            ${this.getUniqueConstitutions(item).length > 0 ? 
                                this.getUniqueConstitutions(item).map(constitution => `<span class="constitution-tag">${constitution}</span>`).join('') : 
                                '<span class="no-data">暂无信息</span>'}
                        </div>
                    </div>
                    
                    ${compatibilitySection}
                    
                    <div class="detail-section">
                        <div class="section-header">
                            <i class="fas fa-prescription-bottle"></i>
                            <h4>用法用量</h4>
                        </div>
                        <div class="dosage-content">${item.dosage_note || '暂无信息'}</div>
                    </div>
                    
                    ${item.contraindications ? `
                        <div class="detail-section warning-section">
                            <div class="section-header">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h4>禁忌</h4>
                            </div>
                            <div class="warning-content">${item.contraindications}</div>
                        </div>
                    ` : ''}
                    
                    ${relatedRecipes.length > 0 ? `
                        <div class="detail-section">
                            <div class="section-header">
                                <i class="fas fa-utensils"></i>
                                <h4>相关配方</h4>
                            </div>
                            <div class="recipes-grid">
                                ${recipesList}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${item.modern_notes ? `
                        <div class="detail-section">
                            <div class="section-header">
                                <i class="fas fa-microscope"></i>
                                <h4>现代研究</h4>
                            </div>
                            <div class="research-content">${item.modern_notes}</div>
                        </div>
                    ` : ''}
                `;
            }
        }
        
        if (content) {
            this.showModal(name, content);
        } else {
            this.showMessage('未找到详细信息', 'warning');
        }
    }

    /**
     * 显示相关配方（从食材详情页跳转）
     */  
    showRelatedRecipe(name, type) {
        // 存储来源信息以便返回
        this.previousDetailInfo = this.currentDetailInfo;
        this.showDetails(name, type);
    }

    /**
     * 返回上级详情页
     */
    goBackToPreviousDetail() {
        if (this.previousDetailInfo) {
            const prevInfo = this.previousDetailInfo;
            this.previousDetailInfo = null; // 清除返回历史
            this.showDetails(prevInfo.name, prevInfo.type);
        }
    }

    /**
     * 显示模态框
     */
    showModal(title, content) {
        const modal = document.getElementById('detail-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            
            // 添加返回按钮（如果有上级页面）
            if (this.previousDetailInfo) {
                const backButton = `
                    <button id="modal-back" class="btn btn-outline back-button" onclick="app.goBackToPreviousDetail()">
                        <i class="fas fa-arrow-left"></i>
                        返回${this.previousDetailInfo.name}
                    </button>
                `;
                modalBody.innerHTML = backButton + content;
            }
            
            modal.classList.add('active');
            
            // 绑定关闭事件
            const closeButtons = modal.querySelectorAll('.modal-close');
            closeButtons.forEach(btn => {
                btn.onclick = () => {
                    modal.classList.remove('active');
                    // 清除返回历史
                    this.previousDetailInfo = null;
                };
            });
            
            // 点击背景关闭
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    // 清除返回历史
                    this.previousDetailInfo = null;
                }
            };

            // 添加键盘事件支持
            const handleKeyPress = (e) => {
                if (e.key === 'Escape') {
                    modal.classList.remove('active');
                    this.previousDetailInfo = null;
                    document.removeEventListener('keydown', handleKeyPress);
                } else if (e.key === 'Backspace' && this.previousDetailInfo) {
                    e.preventDefault();
                    this.goBackToPreviousDetail();
                    document.removeEventListener('keydown', handleKeyPress);
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
        }
    }

    /**
     * 清空搜索
     */
    clearSearch() {
        document.getElementById('global-search').value = '';
        document.getElementById('constitution-filter').value = '';
        document.getElementById('season-filter').value = '';
        document.getElementById('qi-filter').value = '';
        document.getElementById('flavor-filter').value = '';
        
        this.currentResults = [];
        this.displayResults();
        this.updateResultsCount(0);
    }

    /**
     * 更新结果计数
     */
    updateResultsCount(count) {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `共找到 ${count} 条结果`;
        }
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        try {
            const stats = dataManager.stats;
            
            // 更新统计卡片
            const totalIngredients = document.getElementById('total-ingredients');
            if (totalIngredients) totalIngredients.textContent = stats.totalIngredients;
            
            const totalRecipes = document.getElementById('total-recipes');
            if (totalRecipes) totalRecipes.textContent = stats.totalRecipes;
            
            const totalCategories = document.getElementById('total-categories');
            if (totalCategories) totalCategories.textContent = stats.totalCategories;
            
            const totalFavorites = document.getElementById('total-favorites');
            if (totalFavorites) totalFavorites.textContent = '0';
            
            // 更新其他面板的计数
            const ingCount = document.getElementById('ing-count');
            if (ingCount) ingCount.textContent = `共 ${stats.totalIngredients} 种食材`;
            
            const recipeCount = document.getElementById('recipe-count');
            if (recipeCount) recipeCount.textContent = `共 ${stats.totalRecipes} 个配方`;
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
        
        // 更新主题切换按钮图标
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    /**
     * 设置视图模式
     */
    setViewMode(mode) {
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');
        const resultsContainer = document.getElementById('search-results');
        
        if (mode === 'grid') {
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
            resultsContainer.classList.remove('list-view');
            resultsContainer.classList.add('grid-view');
        } else {
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
            resultsContainer.classList.remove('grid-view');
            resultsContainer.classList.add('list-view');
        }
    }

    /**
     * 收藏/取消收藏
     */
    toggleFavorite(name) {
        // 简化的收藏功能
        this.showMessage(`已${Math.random() > 0.5 ? '添加到' : '移除出'}收藏夹：${name}`, 'success');
    }

    /**
     * 过滤药材
     */
    filterHerbs() {
        const category = document.getElementById('herbs-category')?.value || '';
        const constitution = document.getElementById('herbs-constitution')?.value || '';
        const nature = document.getElementById('herbs-nature')?.value || '';
        const taste = document.getElementById('herbs-taste')?.value || '';

        // 从食材中筛选出药材类（这里假设通过gate_category来区分）
        let herbs = dataManager.ingredients.filter(item => {
            const isHerb = item.gate_category && item.gate_category.includes('药材');
            return isHerb;
        });

        // 应用过滤条件
        if (category) {
            herbs = herbs.filter(item => item.gate_category && item.gate_category.includes(category));
        }
        if (constitution) {
            herbs = herbs.filter(item => item.constitutions_suitable && item.constitutions_suitable.includes(constitution));
        }
        if (nature) {
            herbs = herbs.filter(item => item.qi_nature && item.qi_nature.includes(nature));
        }
        if (taste) {
            herbs = herbs.filter(item => item.flavor && item.flavor.includes(taste));
        }

        this.displayHerbsResults(herbs);
    }

    /**
     * 显示药材结果
     */
    displayHerbsResults(herbs) {
        const resultsContainer = document.getElementById('herbs-results');
        if (!resultsContainer) return;
        
        if (herbs.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-results-grid">
                    <div class="no-results">
                        <i class="fas fa-mortar-pestle" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <h3 style="color: #666;">未找到符合条件的药材</h3>
                        <p style="color: #999;">请调整筛选条件</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = herbs.map(item => this.createResultCard(item)).join('');
        resultsContainer.innerHTML = html;
        resultsContainer.classList.add('results-grid');
        
        // 更新计数
        const countElement = document.getElementById('herbs-count');
        if (countElement) {
            countElement.textContent = `共找到 ${herbs.length} 种药材`;
        }
    }

    /**
     * 过滤调味料
     */
    filterSeasonings() {
        const category = document.getElementById('seasonings-category')?.value || '';
        const origin = document.getElementById('seasonings-origin')?.value || '';
        const taste = document.getElementById('seasonings-taste')?.value || '';
        const usage = document.getElementById('seasonings-usage')?.value || '';

        // 从食材中筛选出调味料类
        let seasonings = dataManager.ingredients.filter(item => {
            const isSeasoning = item.gate_category && (
                item.gate_category.includes('调味') || 
                item.gate_category.includes('香料') ||
                item.gate_category.includes('油脂') ||
                item.gate_category.includes('醋') ||
                item.gate_category.includes('盐')
            );
            return isSeasoning;
        });

        // 应用过滤条件
        if (category) {
            seasonings = seasonings.filter(item => item.gate_category && item.gate_category.includes(category));
        }
        if (taste) {
            seasonings = seasonings.filter(item => item.flavor && item.flavor.includes(taste));
        }

        this.displaySeasoningsResults(seasonings);
    }

    /**
     * 显示调味料结果
     */
    displaySeasoningsResults(seasonings) {
        const resultsContainer = document.getElementById('seasonings-results');
        if (!resultsContainer) return;
        
        if (seasonings.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-results-grid">
                    <div class="no-results">
                        <i class="fas fa-pepper-hot" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <h3 style="color: #666;">未找到符合条件的调味料</h3>
                        <p style="color: #999;">请调整筛选条件</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = seasonings.map(item => this.createResultCard(item)).join('');
        resultsContainer.innerHTML = html;
        resultsContainer.classList.add('results-grid');
        
        // 更新计数
        const countElement = document.getElementById('seasonings-count');
        if (countElement) {
            countElement.textContent = `共找到 ${seasonings.length} 种调味料`;
        }
    }

    /**
     * 过滤食材
     */
    filterIngredients() {
        const category = document.getElementById('ing-category')?.value || '';
        const constitution = document.getElementById('ing-constitution')?.value || '';
        const nature = document.getElementById('ing-nature')?.value || '';
        const flavor = document.getElementById('ing-flavor')?.value || '';

        let ingredients = [...dataManager.ingredients];

        // 应用过滤条件
        if (category) {
            ingredients = ingredients.filter(item => item.gate_category && item.gate_category.includes(category));
        }
        if (constitution) {
            ingredients = ingredients.filter(item => item.constitutions_suitable && item.constitutions_suitable.includes(constitution));
        }
        if (nature) {
            ingredients = ingredients.filter(item => item.qi_nature && item.qi_nature.includes(nature));
        }
        if (flavor) {
            ingredients = ingredients.filter(item => item.flavor && item.flavor.includes(flavor));
        }

        this.displayIngredientsResults(ingredients);
    }

    /**
     * 显示食材结果
     */
    displayIngredientsResults(ingredients) {
        const resultsContainer = document.getElementById('ingredients-results');
        if (!resultsContainer) return;
        
        if (ingredients.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-results-grid">
                    <div class="no-results">
                        <i class="fas fa-leaf" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <h3 style="color: #666;">未找到符合条件的食材</h3>
                        <p style="color: #999;">请调整筛选条件</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = ingredients.map(item => this.createResultCard(item)).join('');
        resultsContainer.innerHTML = html;
        resultsContainer.classList.add('results-grid');
        
        // 更新计数
        const countElement = document.getElementById('ing-count');
        if (countElement) {
            countElement.textContent = `共找到 ${ingredients.length} 种食材`;
        }
    }

    /**
     * 过滤配方
     */
    filterRecipes() {
        const category = document.getElementById('recipe-category')?.value || '';
        const constitution = document.getElementById('recipe-constitution')?.value || '';
        const season = document.getElementById('recipe-season')?.value || '';
        const difficulty = document.getElementById('recipe-difficulty')?.value || '';

        let recipes = [...dataManager.recipes];

        // 应用过滤条件
        if (category) {
            recipes = recipes.filter(item => item.intent_tags && item.intent_tags.includes(category));
        }
        if (constitution) {
            recipes = recipes.filter(item => item.constitution_tags && item.constitution_tags.includes(constitution));
        }
        if (season) {
            recipes = recipes.filter(item => item.seasonality && item.seasonality.includes(season));
        }

        this.displayRecipesResults(recipes);
    }

    /**
     * 显示配方结果
     */
    displayRecipesResults(recipes) {
        const resultsContainer = document.getElementById('recipes-results');
        if (!resultsContainer) return;
        
        if (recipes.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-results-grid">
                    <div class="no-results">
                        <i class="fas fa-utensils" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <h3 style="color: #666;">未找到符合条件的配方</h3>
                        <p style="color: #999;">请调整筛选条件</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = recipes.map(item => this.createResultCard(item)).join('');
        resultsContainer.innerHTML = html;
        resultsContainer.classList.add('results-grid');
        
        // 更新计数
        const countElement = document.getElementById('recipe-count');
        if (countElement) {
            countElement.textContent = `共找到 ${recipes.length} 个配方`;
        }
    }

    /**
     * 获取去重后的体质标签
     */
    getUniqueConstitutions(item) {
        const constitutionSources = [
            item.constitutions_suitable || '',
            item.constitution_tags || ''
        ].filter(Boolean);
        
        if (constitutionSources.length === 0) return [];
        
        const allConstitutions = constitutionSources.join(',').split(',')
            .map(c => c.trim())
            .filter(c => c && c !== '')
            .filter((c, index, arr) => arr.indexOf(c) === index); // 去重
            
        return allConstitutions;
    }

    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
            <span>${message}</span>
        `;
        
        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// 创建全局应用实例
const app = new SimpleApp();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    app.init();
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleApp;
} else {
    window.SimpleApp = SimpleApp;
    window.app = app;
}