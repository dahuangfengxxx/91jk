#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import sys

class IngredientChecker:
    def __init__(self, csv_file='ingredients_master.csv'):
        self.existing_ingredients = set()
        self.load_existing_ingredients(csv_file)
    
    def load_existing_ingredients(self, csv_file):
        """加载现有食材名称到集合中"""
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader)  # 跳过标题行
                for row in reader:
                    if row and len(row) >= 1:
                        name_zh = row[0].strip()
                        # 处理括号形式的别名，如"米仁(薏苡仁)"
                        main_name = name_zh.split('(')[0].strip()
                        self.existing_ingredients.add(name_zh)
                        if '(' in name_zh:
                            self.existing_ingredients.add(main_name)
                            # 也添加括号内的名称
                            if ')' in name_zh:
                                alt_name = name_zh.split('(')[1].split(')')[0].strip()
                                self.existing_ingredients.add(alt_name)
        except FileNotFoundError:
            print(f"错误：找不到文件 {csv_file}")
            sys.exit(1)
    
    def check_duplicate(self, name_zh):
        """检查是否与现有食材重复"""
        name_zh = name_zh.strip()
        main_name = name_zh.split('(')[0].strip()
        
        # 检查完全匹配
        if name_zh in self.existing_ingredients:
            return True, f"完全重复：'{name_zh}' 已存在"
        
        # 检查主名称匹配
        if main_name in self.existing_ingredients:
            return True, f"主名称重复：'{main_name}' 已存在"
        
        # 检查括号内的别名
        if '(' in name_zh and ')' in name_zh:
            alt_name = name_zh.split('(')[1].split(')')[0].strip()
            if alt_name in self.existing_ingredients:
                return True, f"别名重复：'{alt_name}' 已存在"
        
        return False, "无重复"
    
    def batch_check(self, candidate_list):
        """批量检查候选食材列表"""
        results = []
        for name in candidate_list:
            is_duplicate, message = self.check_duplicate(name)
            results.append({
                'name': name,
                'is_duplicate': is_duplicate,
                'message': message
            })
        return results
    
    def get_statistics(self):
        """获取现有数据库统计信息"""
        return {
            'total_ingredients': len(self.existing_ingredients),
            'sample_ingredients': sorted(list(self.existing_ingredients))[:20]
        }

# 测试功能
if __name__ == "__main__":
    checker = IngredientChecker()
    stats = checker.get_statistics()
    print(f"数据库中现有食材数量: {stats['total_ingredients']}")
    print(f"前20个食材示例: {', '.join(stats['sample_ingredients'])}")
    
    # 测试一些候选食材
    test_candidates = ["白菜", "卷心菜", "土豆", "红薯", "三七", "大米"]  # 三七和大米应该重复
    results = checker.batch_check(test_candidates)
    
    print("\n测试结果:")
    for result in results:
        status = "❌重复" if result['is_duplicate'] else "✅可添加"
        print(f"{status} {result['name']}: {result['message']}")