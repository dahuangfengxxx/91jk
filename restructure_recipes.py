#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重构菜谱数据结构：将每个菜谱的多个配料从多行转换为多列
从：每个配料占一行，菜谱名称重复
到：每个菜谱占一行，配料作为不同字段
"""

import pandas as pd
import csv
from collections import defaultdict

def restructure_recipes(input_file, output_file):
    """
    重构菜谱数据结构
    """
    print(f"正在读取数据文件: {input_file}")
    
    # 读取原始数据
    df = pd.read_csv(input_file)
    
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
    
    # 统计最大配料数量，用于确定需要多少列
    max_ingredients = max(len(ingredients) for ingredients in recipes.values())
    print(f"最多配料数量: {max_ingredients}")
    
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
    
    print(f"总共处理了 {len(new_df)} 个菜谱")
    print(f"保存到文件: {output_file}")
    
    # 保存为CSV
    new_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    
    return new_df, recipes

def create_summary_report(recipes, output_file):
    """
    创建菜谱摘要报告
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

if __name__ == "__main__":
    input_file = "recipe_ingredients_master.csv"
    output_file = "recipes_restructured.csv"
    summary_file = "recipes_summary.csv"
    
    print("开始重构菜谱数据结构...")
    print("=" * 50)
    
    # 重构数据
    new_df, recipes = restructure_recipes(input_file, output_file)
    
    print("\n创建摘要报告...")
    summary_df = create_summary_report(recipes, summary_file)
    
    print("\n" + "=" * 50)
    print("数据重构完成！")
    print(f"原始格式：每个配料一行，菜谱名称重复")
    print(f"新格式：每个菜谱一行，配料作为多个字段")
    print(f"输出文件：")
    print(f"  - 详细数据：{output_file}")
    print(f"  - 摘要报告：{summary_file}")
    
    # 显示统计信息
    print(f"\n统计信息：")
    print(f"  - 菜谱总数：{len(recipes)}")
    print(f"  - 配料数量分布：")
    
    ingredient_counts = [len(ingredients) for ingredients in recipes.values()]
    from collections import Counter
    count_distribution = Counter(ingredient_counts)
    
    for count, freq in sorted(count_distribution.items()):
        print(f"    {count}个配料：{freq}个菜谱")
    
    print(f"\n前5个菜谱示例：")
    print(new_df.head()[['菜谱名称', '配料总数', '配料1_名称', '配料1_用量', '配料2_名称', '配料2_用量']].to_string(index=False))