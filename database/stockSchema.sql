DROP SCHEMA IF EXISTS stockSchema;
CREATE SCHEMA stockSchema;
USE stockSchema;

CREATE TABLE Users(
	userid VARCHAR(10), # Make Primary Key (Probably Autoincrement)
	pswd VARCHAR(16), 
	sessionID VARCHAR(20),
	fullname VARCHAR(20),
	PRIMARY KEY (userid)
);

CREATE TABLE Stocks(
	stockid VARCHAR(5), # Make Primary Key
	stockname VARCHAR(20),
	PRIMARY KEY (stockid)
);

CREATE TABLE Portfolio(
	stockid VARCHAR(5), # Make Foreign Key
	userid VARCHAR(10),  # Make Foreign Key
	PRIMARY KEY (stockid, userid), # Make both together as Primary key
	FOREIGN KEY (stockid) REFERENCES Stocks(stockid),
	FOREIGN KEY (userid) REFERENCES Users(userid)
);

CREATE TABLE Historical(
	stockid VARCHAR(5), # Make Foreign Key
	open FLOAT,
	high FLOAT,
	low FLOAT, 
	close FLOAT,
	histtime DATE, # Do we need to index this? 
	volume BIGINT,
	FOREIGN KEY (stockid) REFERENCES Stocks(stockid)
);

CREATE TABLE RealTime(
	stockid VARCHAR(5), # Make Foreign Key
	price float,
	realtime datetime, # Probably index this to retrieve last entry for dynamic retrieval?
	volume bigint(20),
	FOREIGN KEY (stockid) REFERENCES Stocks(stockid)
);

COMMIT;

# Initial Setup
insert into Stocks values("GOOG", "Google");
insert into Stocks values("YHOO", "Yahoo");
insert into Stocks values("TSLA", "Telsa");
insert into Stocks values("FB", "Facebook");
insert into Stocks values("AAPL", "Apple");
