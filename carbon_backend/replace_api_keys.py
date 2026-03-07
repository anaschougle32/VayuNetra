#!/usr/bin/env python
"""
Replace old API key with new API key in all HTML template files
"""
import os
import glob

def replace_api_key_in_file(file_path):
    """Replace old API key with new API key in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace old API key with new API key
        old_key = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao'
        new_key = 'AIzaSyDDmDuM0Y6ldYJ65BQ4qttBzhkr78jW42M'
        
        if old_key in content:
            content = content.replace(old_key, new_key)
            print(f"Replaced API key in: {file_path}")
        else:
            print(f"New API key already found in: {file_path}")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return False

def main():
    print("Replacing old API key with new API key in all template files...")
    
    # Find all HTML template files
    template_files = glob.glob('templates/**/*.html')
    
    replaced_count = 0
    for file_path in template_files:
        if replace_api_key_in_file(file_path):
            replaced_count += 1
    
    print(f"\nReplacement Summary:")
    print(f"- Files processed: {len(template_files)}")
    print(f"- Files replaced: {replaced_count}")
    print(f"- Total API key occurrences replaced: {replaced_count}")

if __name__ == '__main__':
    main()
