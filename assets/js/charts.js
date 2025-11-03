/**
 * 图表组件
 * 使用Chart.js创建数据可视化图表
 */

const Charts = {
    charts: new Map(),
    colors: CONFIG.analytics.charts.colors,

    /**
     * 初始化所有图表
     */
    init() {
        if (!dataManager.isLoaded) {
            console.warn('Data not loaded, cannot initialize charts');
            return;
        }

        this.createCategoryChart();
        this.createQiChart();
        this.createConstitutionChart();
        this.createSeasonChart();
    },

    /**
     * 创建食材分类分布图表
     */
    createCategoryChart() {
        const canvas = Utils.dom.$('#category-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = dataManager.stats.categories;
        
        const chartData = {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: this.colors.slice(0, Object.keys(data).length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                ...CONFIG.analytics.charts.options,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('category', chart);
    },

    /**
     * 创建四气分布图表
     */
    createQiChart() {
        const canvas = Utils.dom.$('#qi-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = dataManager.stats.qi;
        
        // 按特定顺序排列四气
        const qiOrder = ['寒', '凉', '平', '温', '热'];
        const labels = qiOrder.filter(qi => data[qi]);
        const values = labels.map(qi => data[qi]);
        const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

        const chartData = {
            labels: labels,
            datasets: [{
                label: '食材数量',
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderRadius: 4,
                borderSkipped: false
            }]
        };

        const chart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                ...CONFIG.analytics.charts.options,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => `${context[0].label}性食材`,
                            label: (context) => `数量: ${context.parsed.y}`
                        }
                    }
                }
            }
        });

        this.charts.set('qi', chart);
    },

    /**
     * 创建体质适配统计图表
     */
    createConstitutionChart() {
        const canvas = Utils.dom.$('#constitution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = dataManager.stats.constitutions;
        
        // 获取前8个最常见的体质类型
        const sortedEntries = Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        const chartData = {
            labels: sortedEntries.map(entry => entry[0]),
            datasets: [{
                label: '适配数量',
                data: sortedEntries.map(entry => entry[1]),
                backgroundColor: this.colors[0],
                borderColor: this.colors[0],
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }]
        };

        const chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                ...CONFIG.analytics.charts.options,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => `${context[0].label}体质`,
                            label: (context) => `适配数量: ${context.parsed.y}`
                        }
                    }
                }
            }
        });

        this.charts.set('constitution', chart);
    },

    /**
     * 创建季节性分布图表
     */
    createSeasonChart() {
        const canvas = Utils.dom.$('#season-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = dataManager.stats.seasons;
        
        // 按季节顺序
        const seasonOrder = ['春', '夏', '秋', '冬', '四季'];
        const labels = seasonOrder.filter(season => data[season]);
        const values = labels.map(season => data[season]);
        const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

        const chartData = {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        };

        const chart = new Chart(ctx, {
            type: 'polarArea',
            data: chartData,
            options: {
                ...CONFIG.analytics.charts.options,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('season', chart);
    },

    /**
     * 更新统计数字
     */
    updateStats() {
        const stats = dataManager.stats;
        
        // 更新统计卡片
        const updateStat = (id, value) => {
            const element = Utils.dom.$(`#${id}`);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        };

        updateStat('total-ingredients', stats.totalIngredients);
        updateStat('total-recipes', stats.totalRecipes);
        updateStat('total-categories', stats.totalCategories);
        updateStat('total-favorites', FavoriteManager.getFavoritesCount());
    },

    /**
     * 创建自定义图表
     */
    createCustomChart(canvasId, type, data, options = {}) {
        const canvas = Utils.dom.$(`#${canvasId}`);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        
        const defaultOptions = {
            ...CONFIG.analytics.charts.options,
            ...options
        };

        const chart = new Chart(ctx, {
            type: type,
            data: data,
            options: defaultOptions
        });

        this.charts.set(canvasId, chart);
        return chart;
    },

    /**
     * 销毁图表
     */
    destroy(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    },

    /**
     * 销毁所有图表
     */
    destroyAll() {
        this.charts.forEach((chart, id) => {
            chart.destroy();
        });
        this.charts.clear();
    },

    /**
     * 重新初始化图表
     */
    refresh() {
        this.destroyAll();
        setTimeout(() => {
            this.init();
            this.updateStats();
        }, 100);
    },

    /**
     * 导出图表为图片
     */
    exportChart(chartId, filename = null) {
        const chart = this.charts.get(chartId);
        if (!chart) {
            Toast.error('导出失败', '图表不存在');
            return;
        }

        const canvas = chart.canvas;
        const url = canvas.toDataURL('image/png');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `${chartId}_${Utils.formatDate(new Date(), 'YYYYMMDD_HHmmss')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        Toast.success('导出成功', '图表已保存为图片');
    },

    /**
     * 响应式处理
     */
    handleResize() {
        this.charts.forEach(chart => {
            chart.resize();
        });
    },

    /**
     * 获取图表统计信息
     */
    getChartStats() {
        const stats = {};
        
        this.charts.forEach((chart, id) => {
            stats[id] = {
                type: chart.config.type,
                datasetCount: chart.data.datasets.length,
                dataPointCount: chart.data.labels ? chart.data.labels.length : 0
            };
        });

        return stats;
    },

    /**
     * 创建趋势图表
     */
    createTrendChart(canvasId, timeData, label = '数量') {
        const canvas = Utils.dom.$(`#${canvasId}`);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        
        const chartData = {
            labels: timeData.map(item => item.date),
            datasets: [{
                label: label,
                data: timeData.map(item => item.value),
                borderColor: this.colors[0],
                backgroundColor: this.colors[0] + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };

        const chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                ...CONFIG.analytics.charts.options,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    },

    /**
     * 创建比较图表
     */
    createComparisonChart(canvasId, categories, datasets) {
        const canvas = Utils.dom.$(`#${canvasId}`);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        
        const chartData = {
            labels: categories,
            datasets: datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: this.colors[index % this.colors.length],
                borderColor: this.colors[index % this.colors.length],
                borderWidth: 2
            }))
        };

        const chart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                ...CONFIG.analytics.charts.options,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }
};

// 窗口大小变化时重新调整图表
window.addEventListener('resize', Utils.throttle(() => {
    Charts.handleResize();
}, 250));

// 导出图表组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Charts;
} else {
    window.Charts = Charts;
}