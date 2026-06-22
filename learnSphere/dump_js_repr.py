from pathlib import Path
path = Path('backend/src/services/ai.service.js')
lines = path.read_text(encoding='utf-8').splitlines()
with open('repr_debug.txt', 'w', encoding='utf-8') as f:
    for i in range(368, 396):
        f.write(f'{i+1:03d}: {repr(lines[i])}\n')
print('dumped')
