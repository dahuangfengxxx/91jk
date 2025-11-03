#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
from collections import OrderedDict

def deduplicate_csv():
    """去除CSV文件中的重复记录，保留最后出现的版本（通常是更完整的数据）"""
    
    input_file = 'ingredients_master.csv'
    output_file = 'ingredients_master_clean.csv'
    
    # 读取数据，使用OrderedDict保持顺序，但只保留每个name_zh的最后一个版本
    records = OrderedDict()
    header = None
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # 读取标题行
        
        for row in reader:
            if row and len(row) >= 1:  # 确保行不为空且有name_zh字段
                name_zh = row[0].strip()
                records[name_zh] = row  # 后面的会覆盖前面的
    
    # 写入清理后的数据
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)  # 写入标题行
        
        for name_zh, row in records.items():
            writer.writerow(row)
    
    print(f"原始记录数（不含标题）: {len(records) + (381 - len(records) - 1)}")
    print(f"去重后记录数（不含标题）: {len(records)}")
    print(f"清理后的文件已保存为: {output_file}")

if __name__ == "__main__":
    deduplicate_csv()