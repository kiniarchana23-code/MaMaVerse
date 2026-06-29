import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
try:
    import main
    print("Main imported successfully")
except Exception as e:
    import traceback
    traceback.print_exc()
