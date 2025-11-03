#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重构 recipe_ingredients_master.csv 数据结构
将每个菜谱的多个配料从多行转换为多列
"""

import pandas as pd
import csv
from collections import defaultdict

def restructure_recipe_ingredients(input_file, output_file):
    """
    重构菜谱配料数据结构
    """
    print(f"正在读取数据文件: {input_file}")
    
    # 读取原始数据
    df = pd.read_csv(input_file)
    
    print(f"原始数据行数: {len(df)}")
    print(f"原始数据列: {list(df.columns)}")
    
    # 按菜谱名称分组
    recipes = defaultdict(list)
    
    for _, row in df.iterrows():
        recipe_name = row['recipe_title']
        ingredient = {
            'name': row['ingredient_name_zh'],
            'amount': row['amount'],
            'note': row['note'] if pd.notna(row['note']) else ''
        }
        recipes[recipe_name].append(ingredient)
    
    # 统计最大配料数量
    max_ingredients = max(len(ingredients) for ingredients in recipes.values())
    print(f"最多配料数量: {max_ingredients}")
    
    # 统计配料数量分布
    ingredient_counts = [len(ingredients) for ingredients in recipes.values()]
    from collections import Counter
    count_distribution = Counter(ingredient_counts)
    print(f"配料数量分布: {dict(count_distribution)}")
    
    # 创建新的数据结构
    new_data = []
    
    for recipe_name, ingredients in recipes.items():
        row = {'菜谱名称': recipe_name, '配料总数': len(ingredients)}
        
        # 为每个配料创建三个字段：名称、用量、备注
        for i, ingredient in enumerate(ingredients, 1):
            row[f'配料{i}_名称'] = ingredient['name']
            row[f'配料{i}_用量'] = ingredient['amount']
            row[f'配料{i}_备注'] = ingredient['note']
        
        # 填充空白字段（如果某个菜谱的配料数少于最大值）
        for i in range(len(ingredients) + 1, max_ingredients + 1):
            row[f'配料{i}_名称'] = ''
            row[f'配料{i}_用量'] = ''
            row[f'配料{i}_备注'] = ''
        
        new_data.append(row)
    
    # 创建DataFrame并保存
    new_df = pd.DataFrame(new_data)
    
    # 按菜谱名称排序
    new_df = new_df.sort_values('菜谱名称')
    
    print(f"重构后菜谱数量: {len(new_df)}")
    print(f"保存到文件: {output_file}")
    
    # 保存为CSV
    new_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    
    return new_df, recipes

def create_compact_summary(recipes, output_file):
    """
    创建紧凑的摘要报告
    """
    summary_data = []
    
    for recipe_name, ingredients in recipes.items():
        # 创建配料列表字符串
        ingredient_list = []
        for ing in ingredients:
            if ing['note']:
                ingredient_list.append(f"{ing['name']}({ing['amount']},{ing['note']})")
            else:
                ingredient_list.append(f"{ing['name']}({ing['amount']})")
        
        summary_data.append({
            '菜谱名称': recipe_name,
            '配料数量': len(ingredients),
            '配料清单': '; '.join(ingredient_list)
        })
    
    summary_df = pd.DataFrame(summary_data)
    summary_df = summary_df.sort_values('菜谱名称')
    summary_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    
    print(f"摘要报告保存到: {output_file}")
    return summary_df

def analyze_ingredients(recipes):
    """
    分析配料使用情况
    """
    print("\n" + "=" * 50)
    print("配料使用分析")
    print("=" * 50)
    
    # 统计所有配料的使用频次
    ingredient_usage = defaultdict(int)
    all_ingredients = set()
    
    for recipe_name, ingredients in recipes.items():
        for ing in ingredients:
            ingredient_name = ing['name']
            ingredient_usage[ingredient_name] += 1
            all_ingredients.add(ingredient_name)
    
    print(f"不同配料总数: {len(all_ingredients)}")
    
    # 显示最常用的配料
    print(f"\n最常用的配料 (使用次数 >= 3):")
    popular_ingredients = [(name, count) for name, count in ingredient_usage.items() if count >= 3]
    popular_ingredients.sort(key=lambda x: x[1], reverse=True)
    
    for name, count in popular_ingredients[:10]:
        print(f"  {name}: {count}次")
    
    return ingredient_usage, all_ingredients

if __name__ == "__main__":
    input_file = "recipe_ingredients_master.csv"
    output_file = "recipe_ingredients_restructured.csv"
    summary_file = "recipe_ingredients_summary.csv"
    
    print("开始重构菜谱配料数据结构...")
    print("=" * 60)
    
    # 重构数据
    new_df, recipes = restructure_recipe_ingredients(input_file, output_file)
    
    print("\n创建摘要报告...")
    summary_df = create_compact_summary(recipes, summary_file)
    
    # 分析配料使用情况
    ingredient_usage, all_ingredients = analyze_ingredients(recipes)
    
    print("\n" + "=" * 60)
    print("数据重构完成！")
    print(f"原始格式：每个配料一行，菜谱名称重复")
    print(f"新格式：每个菜谱一行，配料作为多个字段")
    print(f"输出文件：")
    print(f"  - 详细数据：{output_file}")
    print(f"  - 摘要报告：{summary_file}")
    
    # 显示前几个菜谱示例
    print(f"\n前5个菜谱示例：")
    display_columns = ['菜谱名称', '配料总数', '配料1_名称', '配料1_用量', '配料2_名称', '配料2_用量', '配料3_名称', '配料3_用量']
    available_columns = [col for col in display_columns if col in new_df.columns]
    print(new_df.head()[available_columns].to_string(index=False))