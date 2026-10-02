import uvicorn
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    is_prod = os.environ.get("ENVIRONMENT", "").lower() == "production"
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=not is_prod)
