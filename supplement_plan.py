#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from ingredient_checker import IngredientChecker

def generate_supplement_plan():
    """生成食材补充计划"""
    checker = IngredientChecker()
    
    # 定义常见食材类别及候选食材
    supplement_candidates = {
        "蔬菜类": [
            "白菜", "卷心菜", "包菜", "土豆", "红薯", "紫薯", 
            "豆角", "四季豆", "韭菜", "韭黄", "蒜苗", "蒜薹",
            "莴笋", "生菜", "菜花", "花椰菜", "西兰花", "萝卜叶",
            "空心菜", "通菜", "菠菠菜", "小葱", "大葱", "洋葱头",
            "青椒", "红椒", "辣椒", "尖椒", "彩椒", "豆苗"
        ],
        "水果类": [
            "香蕉", "橘子", "橙子", "芒果", "火龙果", "猕猴桃",
            "草莓", "蓝莓", "樱桃", "荔枝", "龙眼", "石榴",
            "椰子", "菠萝", "哈密瓜", "木瓜", "杏子", "枇杷",
            "山楂", "无花果", "桔子", "柚子肉", "金桔", "青梅"
        ],
        "谷物类": [
            "小麦", "玉米", "燕麦", "黑米", "糯米", "粳米",
            "小米粥", "大麦", "荞麦", "高粱", "薏仁", "麦片"
        ],
        "肉蛋类": [
            "鹅蛋", "鸽蛋", "鱼肉", "草鱼", "鲤鱼", "鲫鱼",
            "带鱼肉", "黄鱼", "鲈鱼", "鳕鱼", "三文鱼", "金枪鱼"
        ],
        "豆类": [
            "绿豆", "黄豆", "黑豆芽", "绿豆芽", "豆腐", "豆浆",
            "腐竹", "豆皮", "豆干", "臭豆腐", "毛豆", "豌豆"
        ],
        "调味品": [
            "生抽", "老抽", "料酒", "米酒", "白酒", "黄酒",
            "芝麻油", "花生油", "菜籽油", "橄榄油", "胡椒粉", "花椒",
            "八角粉", "孜然", "咖喱粉", "辣椒粉", "蚝油", "鸡精"
        ],
        "海产类": [
            "海带", "紫菜", "虾仁", "虾米", "海虾", "河虾",
            "螃蟹肉", "蟹黄", "鱿鱼", "墨鱼", "章鱼", "海参",
            "鲍鱼", "生蚝", "蛤蜊", "蚬子", "田螺", "河蚌"
        ],
        "坚果类": [
            "花生", "瓜子", "葵花籽", "南瓜子", "腰果", "开心果",
            "碧根果", "夏威夷果", "松子", "榛子", "板栗", "白果"
        ]
    }
    
    print("=== 食材数据库补充计划 ===\n")
    print(f"当前数据库食材总数: {checker.get_statistics()['total_ingredients']}\n")
    
    all_new_candidates = []
    
    for category, candidates in supplement_candidates.items():
        print(f"【{category}】分析结果:")
        results = checker.batch_check(candidates)
        
        new_items = [r for r in results if not r['is_duplicate']]
        duplicate_items = [r for r in results if r['is_duplicate']]
        
        print(f"  候选总数: {len(candidates)}")
        print(f"  可新增: {len(new_items)} 个")
        print(f"  已存在: {len(duplicate_items)} 个")
        
        if new_items:
            print("  推荐新增:", end=" ")
            new_names = [item['name'] for item in new_items[:8]]  # 每类最多显示8个
            print(", ".join(new_names))
            if len(new_items) > 8:
                print(f"           ... 还有 {len(new_items) - 8} 个")
            all_new_candidates.extend([item['name'] for item in new_items])
        
        if duplicate_items:
            existing_names = [item['name'] for item in duplicate_items[:5]]
            print(f"  已有食材: {', '.join(existing_names)}")
            if len(duplicate_items) > 5:
                print(f"           ... 还有 {len(duplicate_items) - 5} 个")
        
        print()
    
    print(f"=== 总结 ===")
    print(f"建议新增食材总数: {len(all_new_candidates)} 个")
    print(f"补充后预计总数: {checker.get_statistics()['total_ingredients'] + len(all_new_candidates)} 个")
    
    return all_new_candidates

if __name__ == "__main__":
    new_candidates = generate_supplement_plan()