"""
Master trainer — runs all 3 pipelines per your Data-Type -> Model mapping table
"""
import subprocess, sys, os
PY = r"C:\Users\abina\AppData\Local\Programs\Python\Python313\python.exe"
BASE = r"D:\Clinical Nutritionist datasets\training"
for script in ["train_numerical.py","train_text.py","train_image.py"]:
    p = os.path.join(BASE, script)
    print(f"\n{'='*78}\nRUNNING {script}\n{'='*78}")
    subprocess.run([PY, p], check=False)

print("\nAll pipelines done. See training/REPORT.md and outputs_*/metrics.json")
