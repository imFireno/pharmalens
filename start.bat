@echo off
echo Starting PharmaLens Application...
echo.

echo Installing frontend dependencies...
call npm install

echo.
echo Installing backend dependencies...
cd server
call npm install

echo.
echo Initializing database...
node -e "require('./database/init').initializeDatabase()"

echo.
echo Starting backend server...
start cmd /k "npm run dev"

echo.
echo Backend server started on http://localhost:3000
echo.
echo Opening browser...
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo PharmaLens is now running!
echo - Homepage: http://localhost:3000
echo - Login: http://localhost:3000/login
echo - User Dashboard: http://localhost:3000/dashboard  
echo - Admin Dashboard: http://localhost:3000/admin
echo.
echo Default accounts:
echo Admin - Username: admin, Password: admin123
echo User - Username: testuser, Password: user123
echo.
echo Press any key to exit...
pause > nul
