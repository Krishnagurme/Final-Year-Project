#!/usr/bin/env python3
"""
Fix literal \n escape sequences in ai.service.js that should be actual newlines
"""

def fix_file():
    file_path = 'backend/src/services/ai.service.js'
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Process lines to find and fix corrupted sections
    fixed_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this line contains literal \n escape sequences that shouldn't be there
        # These appear as actual backslash-n (two characters) in the file
        if r'\n' in line and ('{\n' in line or '"' in line):
            # Replace escaped newlines with actual newlines
            # This handles patterns like {\n        "key": value
            line = line.replace(r'{\n', '{\n')  # Keep the opening brace
            line = line.replace(r'\n        ', '\n        ')
            line = line.replace(r'\n      ', '\n      ')
            line = line.replace(r'\n        "', '\n        "')
            line = line.replace(r'}\n', '}\n')
            line = line.replace(r'`\n', '`\n')
        
        fixed_lines.append(line)
        i += 1
    
    # Write fixed content back
    with open(file_path, 'w') as f:
        f.writelines(fixed_lines)
    
    print("File fixed successfully")

if __name__ == '__main__':
    fix_file()
