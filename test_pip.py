import subprocess
try:
    result = subprocess.run(["pip", "install", "--dry-run", "-r", "backend/requirements.txt"], capture_output=True, text=True)
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
except Exception as e:
    print("Exception:", e)
