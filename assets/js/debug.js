/**
 * 调试工具 - 用于测试功能
 */

// 全局调试函数
window.debugApp = {
    // 测试西红柿数据
    testTomato: function() {
        if (window.dataManager && window.dataManager.ingredients) {
            const tomato = window.dataManager.ingredients.find(item => item.name_zh === '西红柿');
            console.log('🍅 西红柿数据:', tomato);
            return tomato;
        } else {
            console.log('❌ DataManager not available');
            return null;
        }
    },
    
    // 测试显示详情功能
    testShowDetails: function(name = '西红柿') {
        if (window.app) {
            console.log('🔍 Testing showDetails with:', name);
            window.app.showDetails(name, 'ingredient');
        } else {
            console.log('❌ App not available');
        }
    },
    
    // 测试数据加载状态
    testDataStatus: function() {
        console.log('📊 Data Manager Status:');
        console.log('- isLoaded:', window.dataManager?.isLoaded);
        console.log('- ingredients count:', window.dataManager?.ingredients?.length);
        console.log('- recipes count:', window.dataManager?.recipes?.length);
        console.log('- app initialized:', window.app?.isInitialized);
    },
    
    // 强制重新显示常用食材
    forceShowPopular: function() {
        if (window.app) {
            console.log('🔄 Force showing popular ingredients');
            window.app.displayPopularIngredients();
        }
    },
    
    // 测试点击事件
    testClickEvent: function() {
        const cards = document.querySelectorAll('.result-card');
        console.log('🎯 Found', cards.length, 'cards');
        if (cards.length > 0) {
            console.log('First card data:', {
                name: cards[0].dataset.name,
                type: cards[0].dataset.type
            });
        }
    }
};

// 页面加载完成后的调试信息
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Debug tools loaded. Use window.debugApp to test functions.');
    
    // 延迟显示调试信息
    setTimeout(() => {
        console.log('=== Debug Status Check ===');
        window.debugApp.testDataStatus();
    }, 2000);
});