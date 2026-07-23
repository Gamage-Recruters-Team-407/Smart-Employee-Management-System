import json

path = r"C:\Users\lahir\.gemini\antigravity-ide\brain\219d4a70-1d97-4e86-9278-2d4d1994c93b\.system_generated\logs\transcript.jsonl"

with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            if step.get("step_index") == 343:
                print("--- STEP 343 CONTENT ---")
                print(step.get("content", ""))
                print("-------------------------")
        except Exception as e:
            pass
