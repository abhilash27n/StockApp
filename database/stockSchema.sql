DROP SCHEMA IF EXISTS stockSchema;
CREATE SCHEMA stockSchema;
USE stockSchema;

CREATE TABLE RealTime(
	name VARCHAR(4),
	price FLOAT, 
	realtime DATETIME,
	volume BIGINT
);

CREATE TABLE Historical(
	name VARCHAR(4),
	open FLOAT,
	high FLOAT,
	low FLOAT, 
	close FLOAT,
	histtime DATE,
	volume BIGINT
);

COMMIT;
