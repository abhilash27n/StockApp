import pandas
import numpy as np
import sys
from sklearn import preprocessing
from sklearn import svm
from sklearn import cross_validation

# read the data
df = pandas.read_csv(sys.argv[1])
daysAhead = int(sys.argv[4])
ndf= pandas.read_csv(sys.argv[2])
myMap={}
# calculate price volatility array given company
def calcLatestVoltility(numDays,priceArray,check):
	lastPrices=priceArray[-numDays-1:]
	#print "Volitility ..."
	#print lastPrices
	#print "..."
	if(check==True):
		print "the last few nasdaq prices are  "
		print lastPrices
	movingVolatilityArray = []
	for i in range(1, numDays+1 ):
		percentChange = 100 * (lastPrices[i] - lastPrices[i-1]) / lastPrices[i-1]
		movingVolatilityArray.append(percentChange)
	if(check==True):
		print "volatilityArray is "
		print movingVolatilityArray
		print "..mean is .."
	volatility=np.mean(movingVolatilityArray)
	if(check==True):
		print volatility
	return volatility
def calcLatestMomentum(numDays,priceArray,check):
	lastPrices=priceArray[-numDays-1:]
	#print "momentum ... "
	#print lastPrices
	#print "..."
	movingMomentumArray = []
	for i in range(1, numDays+1 ):
		movingMomentumArray.append(1 if lastPrices[i] > lastPrices[i-1] else -1)
	momentum=np.mean(movingMomentumArray)
	#print momentum
	return momentum
def calcPriceVolatility(numDays, priceArray):
	global daysAhead
	# make price volatility array
	volatilityArray = []
	movingVolatilityArray = []
	for i in range(1, numDays+1):
		percentChange = 100 * (priceArray[i] - priceArray[i-1]) / priceArray[i-1]
		movingVolatilityArray.append(percentChange)
	volatilityArray.append(np.mean(movingVolatilityArray))

	for i in range(numDays + 1, len(priceArray) - daysAhead):
		del movingVolatilityArray[0]
		percentChange = 100 * (priceArray[i] - priceArray[i-1]) / priceArray[i-1]
		movingVolatilityArray.append(percentChange)
		volatilityArray.append(np.mean(movingVolatilityArray))
	return volatilityArray

# calculate momentum array
def calcMomentum(numDays, priceArray):
	global daysAhead
	# now calculate momentum
	momentumArray = []
	movingMomentumArray = []
	for i in range(1, numDays + 1):
		movingMomentumArray.append(1 if priceArray[i] > priceArray[i-1] else -1)
	momentumArray.append(np.mean(movingMomentumArray))
	for i in range(numDays+1, len(priceArray) - daysAhead):
		del movingMomentumArray[0]
		movingMomentumArray.append(1 if priceArray[i] > priceArray[i-1] else -1)
		momentumArray.append(np.mean(movingMomentumArray))
	return momentumArray

def makeModelAndPredict(permno, numDays,nI ,sectorVolatility, sectorMomentum, splitNumber):
	global df
	global ndf
	global daysAhead
	global mymap
	# get price volatility and momentum for this company
	companyData = df[df['PERMNO'] == permno]
	nasdaqData= ndf['Close']
	nasdaqPrices=list(nasdaqData)
	companyPrices = list(companyData['PRC'])
	volatilityArray = calcPriceVolatility(numDays, companyPrices)
	momentumArray = calcMomentum(numDays, companyPrices)
	splitIndex = splitNumber - numDays
	# since they are different lengths, find the min length
	if len(volatilityArray) > len(sectorVolatility):
		difference = len(volatilityArray) - len(sectorVolatility)
		del volatilityArray[:difference]
		del momentumArray[:difference]

	elif len(sectorVolatility) > len(volatilityArray):
		difference = len(sectorVolatility) - len(volatilityArray)
		del sectorVolatility[:difference]
		del sectorMomentum[:difference]

	# create the feature vectors X
	X = np.transpose(np.array([volatilityArray, momentumArray, sectorVolatility, sectorMomentum]))
	va_predict=[calcLatestVoltility(numDays,companyPrices,False)]
	ma_predict=[calcLatestMomentum(numDays,companyPrices,False)]
#	print "nasdaq latest calcualtion .."
#	print "Comparing latest nasdaqPrices Volitility "
#	print calcLatestVoltility(nI,nasdaqPrices,True)
#	print "with last value of sectorVolatility"
#	print sectorVolatility[len(sectorVolatility)-1]
	sv_last=[sectorVolatility[len(sectorVolatility)-1]]
	sm_last=[sectorMomentum[len(sectorMomentum)-1]]
#	print "...."
	X_predict=np.transpose(np.array([va_predict, ma_predict, sv_last, sm_last]))
	# create the feature vectors Y
	Y = []
	for i in range(numDays, len(companyPrices) - daysAhead):
		Y.append(1 if companyPrices[i+daysAhead] > companyPrices[i] else -1)
	
	# fix the length of Y if necessary
	if len(Y) > len(X):
		difference = len(Y) - len(X)
		del Y[:difference]

	# split into training and testing sets
	X_train = np.array(X[0:splitIndex]).astype('float64')
	X_test = np.array(X[splitIndex:]).astype('float64')
	y_train = np.array(Y[0:splitIndex]).astype('float64')
	y_test = np.array(Y[splitIndex:]).astype('float64')

	# fit the model and calculate its accuracy
	rbf_svm = svm.SVC(kernel='rbf')
	rbf_svm.fit(X_train, y_train)
	ans=rbf_svm.predict(X_predict)
#	print "answer is "
#	print ans
	score = rbf_svm.score(X_test, y_test)
#	print "accuracy is "
#	print score
	myMap[score]=ans
	return score

def main():
	global df
	global myMap
	#print len(x)
	# read the tech sector data
	ndxtdf = pandas.read_csv(sys.argv[2])
	ndxtdf = ndxtdf.sort_values(by='Date', ascending=True)
	ndxtPrices = list(ndxtdf['Close'])	
	#print ndxtdf.shape
	val = int(sys.argv[3])
	startOfTwelve = list(df[df['PERMNO'] == val]['date']).index(20120103)
	# we want to predict where it will be on the next day based on X days previous
	numDaysArray = [5, 10, 20, 90, 270] # day, week, month, quarter, year
	predictionDict = {}
	# iterate over combinations of n_1 and n_2 and find prediction accuracies
	for numDayIndex in numDaysArray:
		for numDayStock in numDaysArray:
			ndxtVolatilityArray = calcPriceVolatility(numDayIndex, ndxtPrices)
			ndxtMomentumArray = calcMomentum(numDayIndex, ndxtPrices)
			percentage = makeModelAndPredict(val,numDayStock,numDayIndex,ndxtVolatilityArray,ndxtMomentumArray,startOfTwelve)
	print myMap[max(myMap)]
if __name__ == "__main__": 
	main()
