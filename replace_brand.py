#!/usr/bin/env python3
import os
import re

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        content = content.replace('缘品荟', '雨姗AI收银助手')
        content = content.replace('夏邑缘品荟', '雨姗AI收银助手')
        content = content.replace('xiayi-yuanpinhui-catering-skill', 'yushan-ai-cashier-assistant')
        content = content.replace('xiayi-yuanpinhui', 'yushan-ai-cashier')
        content = content.replace('夏邑', '')
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'✓ {filepath}')
            return True
        return False
    except Exception as e:
        print(f'✗ {filepath}: {e}')
        return False

def main():
    extensions = ['.html', '.js', '.json', '.md', '.bat', '.yml', '.yaml', '.txt', '.env']
    count = 0
    
    for root, dirs, files in os.walk('.'):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                if replace_in_file(filepath):
                    count += 1
    
    print(f'\n完成！共处理 {count} 个文件')

if __name__ == '__main__':
    main()
