$message = Read-Host "Enter commit message"
git checkout master
git add .
git commit -am $message
git push
git checkout gh-pages
git merge master
git push