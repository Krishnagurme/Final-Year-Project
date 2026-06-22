from pathlib import Path
path = Path('backend/src/services/ai.service.js')
text = path.read_text(encoding='utf-8')
start_marker = '  async generateDynamicTest(subject, numberOfQuestions = 5) {'
end_marker = '  async evaluatePrerequisites(answers, subject, courseLevel) {'
debug = []
debug.append(f'start_found={start_marker in text}')
debug.append(f'end_found={end_marker in text}')
debug.append(f'start_index={text.find(start_marker)}')
debug.append(f'end_index={text.find(end_marker)}')
if start_marker in text:
    idx = text.find(start_marker)
    debug.append('preview_start=' + repr(text[idx:idx+200]))
if end_marker in text:
    idx = text.find(end_marker)
    debug.append('preview_end=' + repr(text[idx-200:idx+100]))
Path('repair_debug.txt').write_text('\n'.join(debug), encoding='utf-8')
print('wrote debug')
