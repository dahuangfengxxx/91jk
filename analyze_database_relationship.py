#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析 recipes_master.csv 和 recipe_ingredients_master.csv 的关系
"""

import pandas as pd
from collections import defaultdict

def analyze_files_relationship():
    """
    分析两个文件的关系
    """
    print("=" * 80)
    print("数据库关系分析：recipes_master.csv vs recipe_ingredients_master.csv")
    print("=" * 80)
    
    # 读取两个文件
    recipes_df = pd.read_csv('recipes_master.csv')
    ingredients_df = pd.read_csv('recipe_ingredients_master.csv')
    
    print(f"\n📋 文件基本信息:")
    print(f"recipes_master.csv: {len(recipes_df)} 行菜谱信息")
    print(f"recipe_ingredients_master.csv: {len(ingredients_df)} 行配料信息")
    
    # 获取菜谱名称集合
    recipes_names = set(recipes_df['title_zh'].unique())
    ingredients_recipes = set(ingredients_df['recipe_title'].unique())
    
    print(f"\n🔍 菜谱数量对比:")
    print(f"recipes_master.csv 中的菜谱数: {len(recipes_names)}")
    print(f"recipe_ingredients_master.csv 中的菜谱数: {len(ingredients_recipes)}")
    
    # 分析关联关系
    print(f"\n🔗 关联关系分析:")
    
    # 完全匹配的菜谱
    common_recipes = recipes_names.intersection(ingredients_recipes)
    print(f"两个文件都有的菜谱数: {len(common_recipes)}")
    
    # 只在recipes_master中的菜谱
    only_in_recipes = recipes_names - ingredients_recipes
    print(f"只在 recipes_master 中的菜谱数: {len(only_in_recipes)}")
    
    # 只在recipe_ingredients中的菜谱
    only_in_ingredients = ingredients_recipes - recipes_names
    print(f"只在 recipe_ingredients 中的菜谱数: {len(only_in_ingredients)}")
    
    # 显示具体的差异
    if only_in_recipes:
        print(f"\n❌ 只在 recipes_master 中的菜谱 (前10个):")
        for i, recipe in enumerate(sorted(only_in_recipes)[:10], 1):
            print(f"  {i}. {recipe}")
        if len(only_in_recipes) > 10:
            print(f"  ... 还有 {len(only_in_recipes) - 10} 个")
    
    if only_in_ingredients:
        print(f"\n❌ 只在 recipe_ingredients 中的菜谱 (前10个):")
        for i, recipe in enumerate(sorted(only_in_ingredients)[:10], 1):
            print(f"  {i}. {recipe}")
        if len(only_in_ingredients) > 10:
            print(f"  ... 还有 {len(only_in_ingredients) - 10} 个")
    
    # 分析数据结构差异
    print(f"\n📊 数据结构对比:")
    print(f"recipes_master.csv 字段:")
    for i, col in enumerate(recipes_df.columns, 1):
        print(f"  {i}. {col}")
    
    print(f"\nrecipe_ingredients_master.csv 字段:")
    for i, col in enumerate(ingredients_df.columns, 1):
        print(f"  {i}. {col}")
    
    # 数据库关系说明
    print(f"\n🏗️  数据库关系说明:")
    print(f"这两个文件构成了一个关系型数据库结构:")
    print(f"")
    print(f"┌─ recipes_master.csv (主表)")
    print(f"│  ├─ 菜谱基本信息：名称、功效、体质、制作方法等")
    print(f"│  ├─ 每个菜谱一行")
    print(f"│  └─ 主键：title_zh (菜谱名称)")
    print(f"│")
    print(f"└─ recipe_ingredients_master.csv (详情表)")
    print(f"   ├─ 菜谱配料详情：配料名称、用量、备注")
    print(f"   ├─ 每个配料一行，同一菜谱可有多行")
    print(f"   └─ 外键：recipe_title → recipes_master.title_zh")
    
    # 完整性检查
    coverage_rate = len(common_recipes) / len(recipes_names) * 100 if recipes_names else 0
    print(f"\n📈 数据完整性:")
    print(f"配料信息覆盖率: {coverage_rate:.1f}%")
    
    if coverage_rate < 100:
        print(f"⚠️  警告: 有 {len(only_in_recipes)} 个菜谱缺少配料信息")
    
    if only_in_ingredients:
        print(f"⚠️  警告: 有 {len(only_in_ingredients)} 个配料记录对应的菜谱信息缺失")
    
    # 数据示例
    print(f"\n💡 数据关联示例:")
    if common_recipes:
        example_recipe = list(common_recipes)[0]
        print(f"以 '{example_recipe}' 为例:")
        
        # 主表信息
        recipe_info = recipes_df[recipes_df['title_zh'] == example_recipe].iloc[0]
        print(f"\n📋 主表信息 (recipes_master):")
        print(f"  功效标签: {recipe_info['intent_tags']}")
        print(f"  适用体质: {recipe_info['constitution_tags']}")
        print(f"  制作方法: {recipe_info['method']}")
        
        # 配料信息
        recipe_ingredients = ingredients_df[ingredients_df['recipe_title'] == example_recipe]
        print(f"\n🥘 配料信息 (recipe_ingredients):")
        for _, ing in recipe_ingredients.iterrows():
            note_text = f"，{ing['note']}" if pd.notna(ing['note']) and ing['note'] else ""
            print(f"  - {ing['ingredient_name_zh']}: {ing['amount']}{note_text}")
    
    return {
        'recipes_count': len(recipes_names),
        'ingredients_recipes_count': len(ingredients_recipes),
        'common_count': len(common_recipes),
        'only_recipes': len(only_in_recipes),
        'only_ingredients': len(only_in_ingredients),
        'coverage_rate': coverage_rate
    }

if __name__ == "__main__":
    stats = analyze_files_relationship()
    
    print(f"\n" + "=" * 80)
    print(f"总结：这是一个典型的一对多关系数据库设计")
    print(f"- recipes_master.csv: 菜谱主信息表")
    print(f"- recipe_ingredients_master.csv: 菜谱配料详情表")
    print(f"- 关联字段: title_zh ↔ recipe_title") 
    print(f"- 数据完整性: {stats['coverage_rate']:.1f}%")
    print("=" * 80)