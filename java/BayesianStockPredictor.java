import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.io.BufferedReader;
import java.io.FileReader;
import org.apache.commons.math3.distribution.NormalDistribution;
import Jama.Matrix;
import java.sql.*;


public class BayesianStockPredictor {

	//Alpha and beta values
	static final double Alpha= 0.005;
	static final double Beta= 11.1;

	static final int M=4;
	static Matrix S;
	//number of inputs
	int N;	
	//value to be predicted
	double x; 
	// price values and their ids 
	double[] xArray; 
	double[] tValues; 

	public BayesianStockPredictor(){}

	public BayesianStockPredictor(double[] tValues,int N, double x) {
			//Initialize all the fields
		    this.tValues = tValues;
			this.N=N;
			this.x=x;
			
			xArray = new double[N];
			
			for (int i = 0; i < N; i++) {
				xArray[i] = i+1;
			}
	}
	
	public double[] getPrediction(double[] prices) {
		
		double[] predicted = new double[60];
		BufferedReader br = null;
		// Read data from csv file 
		for(int i = 0;i<60;i++){
			double pVal= BayesianStockPredictor.predict(prices);
			predicted[i] = pVal;
		}
				
		return predicted;
	}
	//get the value of S matrix
	private Matrix calculateS(Matrix phixt) {
		Matrix SInverse=  Matrix.identity(M+1, M+1).times(Alpha);
		Matrix phiSum = new Matrix(M + 1, M + 1);
		for(int i=0;i<N;i++){
			phiSum.plusEquals(calculatePhi(xArray[i]).times(phixt));	
		}
		SInverse = SInverse.plusEquals(phiSum.times(Beta));
		return SInverse.inverse();
	}
	//get the value of phi
	private Matrix calculatePhi(double x){
		Matrix phivals = new Matrix(M + 1, 1);
		for (int i = 0; i < M + 1; i++) {
			phivals.set(i, 0, (Math.pow(x	, i)));
		}		
		return phivals;
	}

	private double calculateMean(Matrix phit) {
		//calculate mean
		Matrix mean= phit.times(S).times(Beta);
		Matrix sum = calculatePhi(xArray[0]).times(tValues[0]);
		for(int i=0;i<N;i++){ 
			sum.plusEquals(calculatePhi(xArray[i]).times(tValues[i]));			
		}
		mean=mean.times(sum);
		return mean.get(0, 0);
	}
	
	private double calculateVariance(Matrix phix, Matrix phit) {
		//calculate variance 
		double var=1/Beta;
		Matrix v=phit.times(S);
		v=v.times(phix);
		var=var+v.get(0, 0);
		return var;
	}

	public static  double predict(double[] prices) {
		
		BayesianStockPredictor bayes=new BayesianStockPredictor(prices,10,11);
		Matrix phix=bayes.calculatePhi(bayes.x);
		Matrix phixt=phix.transpose();
			
		//Get the value of S matrix, mean and variance
		S = bayes.calculateS(phixt);
		double mean = bayes.calculateMean(phixt);
		double variance = bayes.calculateVariance(phix,phixt);
			
		NormalDistribution gaussian = new NormalDistribution(mean,Math.sqrt(variance));
		double pred = gaussian.sample();
		
		return pred;
	}
}