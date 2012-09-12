$message = Read-Host "Enter commit message"
git add .
git commit -m $message
git push
git checkout gh-pages
git merge master
git push