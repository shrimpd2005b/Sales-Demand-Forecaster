============================================
  SALES DEMAND FORECASTER
============================================

REQUIREMENTS (install these first if you haven't):
  - Python 3.9+  →  https://python.org        (tick "Add to PATH" during install!)
  - Node.js 18+  →  https://nodejs.org

--------------------------------------------
FIRST TIME SETUP (run once):
--------------------------------------------
Double-click:  SETUP.bat

This will automatically:
  ✔ Install all Python packages
  ✔ Generate the sales_data.csv file
  ✔ Install all Angular/Node packages

Takes about 5 minutes on first run.

--------------------------------------------
STARTING THE APP (every time):
--------------------------------------------
Double-click:  START_APP.bat

This will:
  ✔ Start the Flask backend  (port 5000)
  ✔ Start the Angular frontend (port 4200)
  ✔ Open your browser automatically

--------------------------------------------
MANUAL URLs:
--------------------------------------------
  App:     http://localhost:4200
  API:     http://localhost:5000/api/products

--------------------------------------------
TROUBLESHOOTING:
--------------------------------------------
  • "python not found"     → Reinstall Python, tick "Add to PATH"
  • "ng not found"         → Close terminal, reopen, try again  
  • Chart not loading      → Make sure Flask window is still open
  • Red "execution policy" → Run PowerShell as Admin and type:
                             Set-ExecutionPolicy RemoteSigned
============================================
