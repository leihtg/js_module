@echo off

set cd=%~dp0
cd %cd%

set proFile=index
set key=version
set version=
for /f %%i in ('findstr "^%key%" %proFile%') do set version=%%i
set /a verNum=%version:~8% + 1
echo version=%verNum% > %proFile%

git add .
git commit -m "%verNum% , %DATE% %TIME%"

git fetch origin master
git rebase

git push

pause