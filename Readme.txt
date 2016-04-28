Instructions for running the Application. The following instructions are tested on Ubuntu 14.04 and Windows 10:
======================================================================================================

1) Setup Node JS using following installation guide. You can also refer to this link Node JS Setup(	    https://www.youtube.com/watch?v=FqMIyTH9wSg):

    https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

	curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - sudo apt-get install -y nodejs
2) Build using following command:

	sudo apt-get install -y build-essential

3) Verify that node js has been installed

	node -v npm -v

4) Install express using following command:

	sudo npm install -g express-generator

5) Install Nodemon using following command to restarts server automatically everytime you change file:

	npm install -g nodemon

6) Install dependencies using following command:

	npm install

7) Install yahoo finance and cron APIs using:
	
	npm install google-stocks --save 
	npm install yahoo-finance --save 
	npm install cron --save

8) Install MySQL using following command:

	npm install node-mysql --save

9) Run following command:
	
	nodemon bin/www

Note: IF YOU ALREADY HAVE NODEJS INSTALLED, pull repo, do "npm install" inside pulled repo to install all dependencies, and run using "nodemon bin/www"