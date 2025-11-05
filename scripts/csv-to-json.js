#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * 将CSV文件转换为JSON并进行基础加密
 */
class CSVToJSONConverter {
    constructor() {
        this.dataDir = path.join(__dirname, '..');
        this.outputDir = path.join(this.dataDir, 'data');
        
        // 确保输出目录存在
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * 简单的字符串混淆（可逆）
     */
    obfuscate(str) {
        return Buffer.from(str).toString('base64');
    }

    /**
     * 反混淆
     */
    deobfuscate(str) {
        return Buffer.from(str, 'base64').toString('utf-8');
    }

    /**
     * 读取CSV文件并转换为JSON
     */
    async convertCSVToJSON(csvFileName, jsonFileName) {
        return new Promise((resolve, reject) => {
            const results = [];
            const csvPath = path.join(this.dataDir, csvFileName);
            const jsonPath = path.join(this.outputDir, jsonFileName);

            console.log(`Converting ${csvFileName} to ${jsonFileName}...`);

            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (data) => {
                    // 确保数据不为空
                    if (data && Object.keys(data).length > 0) {
                        results.push(data);
                    }
                })
                .on('end', () => {
                    console.log(`📊 Processing ${results.length} records from ${csvFileName}`);
                    
                    if (results.length === 0) {
                        console.warn(`⚠️  No data found in ${csvFileName}`);
                    }
                    
                    // 对敏感数据进行混淆
                    const obfuscatedData = {
                        timestamp: Date.now(),
                        checksum: this.generateChecksum(results),
                        data: this.obfuscate(JSON.stringify(results))
                    };

                    fs.writeFileSync(jsonPath, JSON.stringify(obfuscatedData, null, 2));
                    console.log(`✅ Converted ${results.length} records to ${jsonFileName}`);
                    resolve(results.length);
                })
                .on('error', reject);
        });
    }

    /**
     * 生成数据校验和
     */
    generateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * 转换所有CSV文件
     */
    async convertAll() {
        try {
            const conversions = [
                { csv: 'ingredients_master.csv', json: 'ingredients.json' },
                { csv: 'recipes_master.csv', json: 'recipes.json' },
                { csv: 'recipe_ingredients_restructured.csv', json: 'recipe_ingredients.json' }
            ];

            console.log('🔄 Starting CSV to JSON conversion...');
            
            for (const { csv, json } of conversions) {
                await this.convertCSVToJSON(csv, json);
            }

            // 生成API配置文件
            this.generateAPIConfig();

            console.log('✅ All conversions completed successfully!');
            console.log('📁 JSON files saved to:', this.outputDir);
            
        } catch (error) {
            console.error('❌ Conversion failed:', error);
        }
    }

    /**
     * 生成API配置文件
     */
    generateAPIConfig() {
        const config = {
            version: '1.0.0',
            endpoints: {
                ingredients: '/data/ingredients.json',
                recipes: '/data/recipes.json',
                recipeIngredients: '/data/recipe_ingredients.json'
            },
            security: {
                requireReferer: true,
                rateLimit: {
                    requests: 100,
                    window: 3600000 // 1小时
                }
            },
            lastUpdated: new Date().toISOString()
        };

        const configPath = path.join(this.outputDir, 'api-config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('📄 API configuration saved to api-config.json');
    }
}

// 检查是否安装了csv-parser
try {
    require('csv-parser');
} catch (e) {
    console.log('Installing csv-parser...');
    require('child_process').execSync('npm install csv-parser', { stdio: 'inherit' });
}

// 运行转换
const converter = new CSVToJSONConverter();
converter.convertAll();