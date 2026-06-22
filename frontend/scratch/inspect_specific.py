import json

path = r"C:\Users\lahir\.gemini\antigravity-ide\brain\219d4a70-1d97-4e86-9278-2d4d1994c93b\.system_generated\logs\transcript.jsonl"

with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            idx = step.get('step_index')
            if idx in [380, 388]:
                print(f"Step {idx}:")
                # Print first 1000 characters of the JSON string representation
                print(json.dumps(step)[:1000])
                print("-" * 50)
        except Exception as e:
            pass
