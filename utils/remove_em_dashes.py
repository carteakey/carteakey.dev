import os

repo_dir = '/Users/kchauhan/repos/carteakey.dev/src'
count = 0
for root, dirs, files in os.walk(repo_dir):
    for f in files:
        if f.endswith(('.md', '.njk', '.js', '.html', '.css', '.yaml')):
            filepath = os.path.join(root, f)
            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                if '—' in content:
                    # Replace em dashes with normal dashes
                    new_content = content.replace('—', '-')
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    count += 1
                    print(f'Updated {filepath}')
            except Exception as e:
                pass
print(f'Modified {count} files.')
