/**
 * UI组件库
 * 提供各种可重用的UI组件
 */

const Components = {
    /**
     * Toast通知组件
     */
    Toast: {
        container: null,

        init() {
            this.container = Utils.dom.$('#toast-container');
            if (!this.container) {
                this.container = Utils.dom.create('div', {
                    id: 'toast-container',
                    className: 'toast-container'
                });
                document.body.appendChild(this.container);
            }
        },

        show(type, title, message, duration = 4000) {
            if (!this.container) this.init();

            const toast = Utils.dom.create('div', {
                className: `toast ${type}`
            });

            const icon = this.getIcon(type);
            
            toast.innerHTML = `
                <i class="toast-icon ${icon}"></i>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            `;

            // 添加关闭事件
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.remove(toast));

            // 添加到容器
            this.container.appendChild(toast);

            // 自动移除
            if (duration > 0) {
                setTimeout(() => this.remove(toast), duration);
            }

            return toast;
        },

        success(title, message, duration) {
            return this.show('success', title, message, duration);
        },

        error(title, message, duration) {
            return this.show('error', title, message, duration);
        },

        warning(title, message, duration) {
            return this.show('warning', title, message, duration);
        },

        info(title, message, duration) {
            return this.show('info', title, message, duration);
        },

        remove(toast) {
            if (toast && toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        },

        getIcon(type) {
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            return icons[type] || icons.info;
        },

        clear() {
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    },

    /**
     * 模态框组件
     */
    Modal: {
        current: null,

        show(title, content, options = {}) {
            this.hide(); // 关闭当前模态框

            const modal = Utils.dom.$('#detail-modal');
            if (!modal) return;

            const modalTitle = modal.querySelector('#modal-title');
            const modalBody = modal.querySelector('#modal-body');
            const favoriteBtn = modal.querySelector('#modal-favorite');
            const shareBtn = modal.querySelector('#modal-share');

            modalTitle.textContent = title;
            modalBody.innerHTML = content;

            // 设置按钮状态
            if (options.showFavorite) {
                favoriteBtn.style.display = 'inline-flex';
                favoriteBtn.onclick = options.onFavorite;
                favoriteBtn.innerHTML = options.isFavorite 
                    ? '<i class="fas fa-heart"></i> 已收藏'
                    : '<i class="far fa-heart"></i> 收藏';
                favoriteBtn.classList.toggle('active', options.isFavorite);
            } else {
                favoriteBtn.style.display = 'none';
            }

            if (options.showShare) {
                shareBtn.style.display = 'inline-flex';
                shareBtn.onclick = options.onShare;
            } else {
                shareBtn.style.display = 'none';
            }

            modal.classList.add('active');
            this.current = modal;

            // 阻止背景滚动
            document.body.style.overflow = 'hidden';

            return modal;
        },

        hide() {
            const modal = Utils.dom.$('#detail-modal');
            if (modal) {
                modal.classList.remove('active');
                this.current = null;
                document.body.style.overflow = '';
            }
        }
    },

    /**
     * 分页组件
     */
    Pagination: {
        render(container, currentPage, totalPages, onPageChange) {
            if (typeof container === 'string') {
                container = Utils.dom.$(container);
            }
            if (!container) return;

            container.innerHTML = '';

            if (totalPages <= 1) return;

            const pagination = Utils.dom.create('div', { className: 'pagination' });

            // 上一页按钮
            const prevBtn = Utils.dom.create('button', {
                className: 'pagination-btn',
                disabled: currentPage <= 1
            }, '上一页');
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) onPageChange(currentPage - 1);
            });
            pagination.appendChild(prevBtn);

            // 页码按钮
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);

            if (startPage > 1) {
                const firstBtn = this.createPageButton(1, currentPage, onPageChange);
                pagination.appendChild(firstBtn);
                
                if (startPage > 2) {
                    const ellipsis = Utils.dom.create('span', { className: 'pagination-ellipsis' }, '...');
                    pagination.appendChild(ellipsis);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = this.createPageButton(i, currentPage, onPageChange);
                pagination.appendChild(pageBtn);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const ellipsis = Utils.dom.create('span', { className: 'pagination-ellipsis' }, '...');
                    pagination.appendChild(ellipsis);
                }
                
                const lastBtn = this.createPageButton(totalPages, currentPage, onPageChange);
                pagination.appendChild(lastBtn);
            }

            // 下一页按钮
            const nextBtn = Utils.dom.create('button', {
                className: 'pagination-btn',
                disabled: currentPage >= totalPages
            }, '下一页');
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) onPageChange(currentPage + 1);
            });
            pagination.appendChild(nextBtn);

            container.appendChild(pagination);
        },

        createPageButton(page, currentPage, onPageChange) {
            const button = Utils.dom.create('button', {
                className: `pagination-btn ${page === currentPage ? 'active' : ''}`
            }, page.toString());
            
            button.addEventListener('click', () => onPageChange(page));
            return button;
        }
    },

    /**
     * 卡片组件
     */
    Card: {
        createIngredientCard(ingredient, options = {}) {
            const card = Utils.dom.create('div', {
                className: 'result-card ingredient-card',
                dataset: { type: 'ingredient', id: ingredient.name_zh }
            });

            const isFavorite = FavoriteManager.isFavorite(ingredient.name_zh, 'ingredient');

            card.innerHTML = `
                <div class="result-card-header">
                    <h3 class="result-title">${ingredient.name_zh}</h3>
                    <span class="result-category ingredient">${ingredient.gate_category}</span>
                </div>
                <div class="result-properties">
                    ${ingredient.four_qi ? `<span class="property-tag qi">${ingredient.four_qi}</span>` : ''}
                    ${ingredient.five_flavors ? `<span class="property-tag flavor">${ingredient.five_flavors}</span>` : ''}
                    ${ingredient.constitutions_suitable ? `<span class="property-tag constitution">${ingredient.constitutions_suitable}</span>` : ''}
                    ${ingredient.seasonality ? `<span class="property-tag season">${ingredient.seasonality}</span>` : ''}
                </div>
                <div class="result-description">
                    <p><strong>主要功能：</strong>${ingredient.primary_functions || '暂无描述'}</p>
                    ${ingredient.indications ? `<p><strong>主治：</strong>${ingredient.indications}</p>` : ''}
                    ${ingredient.meridians ? `<p><strong>归经：</strong>${ingredient.meridians}</p>` : ''}
                </div>
                <div class="result-actions">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${ingredient.name_zh}" data-type="ingredient">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="btn btn-outline view-detail-btn">查看详情</button>
                </div>
            `;

            // 添加事件监听
            this.addCardEvents(card, ingredient, 'ingredient');

            return card;
        },

        createRecipeCard(recipe, options = {}) {
            const card = Utils.dom.create('div', {
                className: 'result-card recipe-card',
                dataset: { type: 'recipe', id: recipe.title_zh }
            });

            const ingredients = dataManager.getRecipeIngredients(recipe.title_zh);
            const ingredientList = ingredients.map(ing => ing.name).join('、');
            const isFavorite = FavoriteManager.isFavorite(recipe.title_zh, 'recipe');

            card.innerHTML = `
                <div class="result-card-header">
                    <h3 class="result-title">${recipe.title_zh}</h3>
                    <span class="result-category recipe">配方</span>
                </div>
                <div class="result-properties">
                    ${recipe.constitution_tags ? `<span class="property-tag constitution">${recipe.constitution_tags}</span>` : ''}
                    ${recipe.seasonality ? `<span class="property-tag season">${recipe.seasonality}</span>` : ''}
                </div>
                <div class="result-description">
                    <p><strong>功效：</strong>${recipe.intent_tags || '暂无描述'}</p>
                    ${ingredientList ? `<p><strong>配料：</strong>${ingredientList}</p>` : ''}
                    ${recipe.method ? `<p><strong>制法：</strong>${recipe.method}</p>` : ''}
                </div>
                <div class="result-actions">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${recipe.title_zh}" data-type="recipe">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="btn btn-outline view-detail-btn">查看详情</button>
                </div>
            `;

            // 添加事件监听
            this.addCardEvents(card, recipe, 'recipe');

            return card;
        },

        addCardEvents(card, data, type) {
            // 收藏按钮事件
            const favoriteBtn = card.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    FavoriteManager.toggle(data, type);
                    this.updateFavoriteButton(favoriteBtn, data, type);
                });
            }

            // 查看详情按钮事件
            const detailBtn = card.querySelector('.view-detail-btn');
            if (detailBtn) {
                detailBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showDetail(data, type);
                });
            }

            // 卡片点击事件
            card.addEventListener('click', () => {
                this.showDetail(data, type);
            });
        },

        updateFavoriteButton(button, data, type) {
            const isFavorite = FavoriteManager.isFavorite(data.name_zh || data.title_zh, type);
            const icon = button.querySelector('i');
            
            button.classList.toggle('active', isFavorite);
            icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        },

        showDetail(data, type) {
            let content = '';
            let title = '';

            if (type === 'ingredient') {
                title = data.name_zh;
                content = this.createIngredientDetailContent(data);
            } else if (type === 'recipe') {
                title = data.title_zh;
                content = this.createRecipeDetailContent(data);
            }

            const isFavorite = FavoriteManager.isFavorite(data.name_zh || data.title_zh, type);

            Components.Modal.show(title, content, {
                showFavorite: true,
                isFavorite: isFavorite,
                onFavorite: () => {
                    FavoriteManager.toggle(data, type);
                    // 更新模态框中的收藏按钮
                    const favoriteBtn = Utils.dom.$('#modal-favorite');
                    const newIsFavorite = FavoriteManager.isFavorite(data.name_zh || data.title_zh, type);
                    favoriteBtn.innerHTML = newIsFavorite 
                        ? '<i class="fas fa-heart"></i> 已收藏'
                        : '<i class="far fa-heart"></i> 收藏';
                    favoriteBtn.classList.toggle('active', newIsFavorite);
                },
                showShare: true,
                onShare: () => {
                    this.shareItem(data, type);
                }
            });
        },

        createIngredientDetailContent(ingredient) {
            const recipes = dataManager.getIngredientRecipes(ingredient.name_zh);
            
            return `
                <div class="ingredient-detail">
                    <div class="detail-section">
                        <h4>基本信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>分类</label>
                                <span>${ingredient.gate_category} - ${ingredient.subcategory}</span>
                            </div>
                            <div class="detail-item">
                                <label>四气</label>
                                <span>${ingredient.four_qi || '未知'}</span>
                            </div>
                            <div class="detail-item">
                                <label>五味</label>
                                <span>${ingredient.five_flavors || '未知'}</span>
                            </div>
                            <div class="detail-item">
                                <label>归经</label>
                                <span>${ingredient.meridians || '未知'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>功效主治</h4>
                        <p><strong>主要功能：</strong>${ingredient.primary_functions || '暂无描述'}</p>
                        ${ingredient.indications ? `<p><strong>主治：</strong>${ingredient.indications}</p>` : ''}
                        ${ingredient.modern_notes ? `<p><strong>现代研究：</strong>${ingredient.modern_notes}</p>` : ''}
                    </div>

                    <div class="detail-section">
                        <h4>使用指南</h4>
                        ${ingredient.constitutions_suitable ? `<p><strong>适宜体质：</strong>${ingredient.constitutions_suitable}</p>` : ''}
                        ${ingredient.contraindications ? `<p><strong>禁忌：</strong>${ingredient.contraindications}</p>` : ''}
                        ${ingredient.seasonality ? `<p><strong>适宜季节：</strong>${ingredient.seasonality}</p>` : ''}
                        ${ingredient.dosage_note ? `<p><strong>用量：</strong>${ingredient.dosage_note}</p>` : ''}
                        ${ingredient.prep_methods ? `<p><strong>炮制方法：</strong>${ingredient.prep_methods}</p>` : ''}
                    </div>

                    <div class="detail-section">
                        <h4>搭配宜忌</h4>
                        ${ingredient.pairing_good ? `<p><strong>相宜搭配：</strong>${ingredient.pairing_good}</p>` : ''}
                        ${ingredient.pairing_bad ? `<p><strong>相忌搭配：</strong>${ingredient.pairing_bad}</p>` : ''}
                    </div>

                    ${recipes.length > 0 ? `
                        <div class="detail-section">
                            <h4>相关配方 (${recipes.length})</h4>
                            <div class="related-recipes">
                                ${recipes.slice(0, 5).map(recipeName => `
                                    <span class="recipe-tag" data-recipe="${recipeName}">${recipeName}</span>
                                `).join('')}
                                ${recipes.length > 5 ? `<span class="more">...还有${recipes.length - 5}个</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        },

        createRecipeDetailContent(recipe) {
            const ingredients = dataManager.getRecipeIngredients(recipe.title_zh);
            
            return `
                <div class="recipe-detail">
                    <div class="detail-section">
                        <h4>配方信息</h4>
                        <p><strong>功效：</strong>${recipe.intent_tags || '暂无描述'}</p>
                        ${recipe.constitution_tags ? `<p><strong>适宜体质：</strong>${recipe.constitution_tags}</p>` : ''}
                        ${recipe.seasonality ? `<p><strong>适宜季节：</strong>${recipe.seasonality}</p>` : ''}
                    </div>

                    ${ingredients.length > 0 ? `
                        <div class="detail-section">
                            <h4>配料组成</h4>
                            <div class="ingredients-list">
                                ${ingredients.map(ing => `
                                    <div class="ingredient-item">
                                        <span class="name">${ing.name}</span>
                                        <span class="amount">${ing.amount}</span>
                                        ${ing.note ? `<span class="note">${ing.note}</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="detail-section">
                        <h4>制作方法</h4>
                        <p>${recipe.method || '暂无制作方法'}</p>
                    </div>

                    <div class="detail-section">
                        <h4>服用方法</h4>
                        <p>${recipe.usage || '暂无服用说明'}</p>
                    </div>

                    ${recipe.cautions ? `
                        <div class="detail-section">
                            <h4>注意事项</h4>
                            <p class="caution-text">${recipe.cautions}</p>
                        </div>
                    ` : ''}

                    ${recipe.source_ref ? `
                        <div class="detail-section">
                            <h4>参考文献</h4>
                            <p class="source-text">${recipe.source_ref}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        },

        shareItem(data, type) {
            const title = data.name_zh || data.title_zh;
            const url = window.location.href;
            
            if (navigator.share) {
                navigator.share({
                    title: `${title} - 随息居`,
                    text: `查看${type === 'ingredient' ? '食材' : '配方'}：${title}`,
                    url: url
                }).catch(console.error);
            } else {
                // 复制到剪贴板
                const shareText = `${title} - 随息居\n${url}`;
                navigator.clipboard.writeText(shareText).then(() => {
                    Components.Toast.success('分享', '链接已复制到剪贴板');
                }).catch(() => {
                    Components.Toast.error('分享失败', '无法复制到剪贴板');
                });
            }
        }
    },

    /**
     * 加载指示器组件
     */
    Loading: {
        show(message = '加载中...') {
            let overlay = Utils.dom.$('#loading-overlay');
            if (!overlay) {
                overlay = Utils.dom.create('div', {
                    id: 'loading-overlay',
                    className: 'loading-overlay'
                });
                document.body.appendChild(overlay);
            }

            overlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-seedling fa-spin"></i>
                    <p>${message}</p>
                </div>
            `;
            overlay.style.display = 'flex';
        },

        hide() {
            const overlay = Utils.dom.$('#loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    }
};

// 初始化Toast组件
Components.Toast.init();

// 添加模态框关闭事件
Utils.dom.on(document, 'click', (e) => {
    const modal = Utils.dom.$('#detail-modal');
    if (modal && modal.classList.contains('active')) {
        if (e.target.classList.contains('modal-close') || e.target === modal) {
            Components.Modal.hide();
        }
    }
});

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Components;
} else {
    window.Components = Components;
    window.Toast = Components.Toast;
    window.Modal = Components.Modal;
}