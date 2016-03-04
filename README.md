STOCK APP

Node JS Setup(https://www.youtube.com/watch?v=FqMIyTH9wSg)
------

INSTALL(https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
----
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

TOOLS
----
sudo apt-get install -y build-essential

VERIFY
----
node -v
npm -v

INSTALL EXPRESS
----
sudo npm install -g express-generator

NODEMON install(Restarts server automatically everytime you change file)
-----
npm install -g nodemon

START PROJECT(with hogan template for html processing)
----
express StockApp --hogan -c less
cd StockApp

INSTALL DEPENDENCIES
-----
npm install 

RUN TO CHECK
----
DEBUG=StockApp:server ./bin/www
localhost:3000

RUN WITH NODEMON
----
nodemon bin/www

GOOGLE STOCK API and YAHOO FINANCE API
----
npm install google-stocks --save
npm install yahoo-finance --save
npm install cron --save


MySQL INSTALLATION(https://codeforgeek.com/2015/01/nodejs-mysql-tutorial/)
----
npm install node-mysql --save



IF YOU ALREADY HAVE NODEJS INSTALLED, pull repo, do "npm install" inside pulled repo to install all dependencies, and run using "nodemon bin/www"