import { db } from './db';
import { getTotalExpensesByBatch } from './expenseQueries';
import { getFeedByBatch } from './feedQueries';
import { getMortalityByBatch } from './mortalityQueries';
import { getActiveProjectId } from './projectContext';
import { getSalesByBatch } from './salesQueries';

export const calculateFeedCost = async (batchId) => {
  const feed = getFeedByBatch(batchId);
  return feed.reduce((sum, item) => sum + item.quantityKg * item.pricePerKg, 0);
};

export const calculateInvestment = async (batch) => {
  const feedCost = await calculateFeedCost(batch.id);
  const otherExpenses = getTotalExpensesByBatch(batch.id);
  const chicksCost = batch.initialChicks * batch.chickPrice;
  return chicksCost + feedCost + otherExpenses;
};

export const calculateAvailableBirds = async (batch) => {
  const dead = getMortalityByBatch(batch.id);
  const result = db.getFirstSync(
    `SELECT SUM(quantity) AS sold FROM sales WHERE projectId=? AND batchId=? AND saleType='per_bird'`,
    [getActiveProjectId(), batch.id]
  );
  const sold = result?.sold || 0;
  return Math.max(batch.initialChicks - dead - sold, 0);
};

export const calculateProfit = async (batch) => {
  const investment = await calculateInvestment(batch);
  const revenue = getSalesByBatch(batch.id);
  return revenue - investment;
};

export const calculateProgress = (startDate) => {
  const days = (new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24);
  return Math.min(Math.round((days / 42) * 100), 100);
};

export const calculateADG = async (batch, finalWeightKg) => {
  const availableBirds = await calculateAvailableBirds(batch);
  const days = (new Date() - new Date(batch.startDate)) / (1000 * 60 * 60 * 24);
  const weightGain = finalWeightKg - (batch.initialWeightKg || 0);
  return availableBirds > 0 && days > 0 ? weightGain / (availableBirds * days) : 0;
};

export const calculateFCR = async (batch, finalWeightKg) => {
  const feed = getFeedByBatch(batch.id);
  const totalFeedKg = feed.reduce((sum, item) => sum + item.quantityKg, 0);
  const availableBirds = await calculateAvailableBirds(batch);
  const totalWeightGain = availableBirds * (finalWeightKg - (batch.initialWeightKg || 0));
  return totalWeightGain > 0 ? totalFeedKg / totalWeightGain : 0;
};

export const calculateTotalRevenue = async (batchId) => getSalesByBatch(batchId);

export const calculateTotalCost = async (batch) => calculateInvestment(batch);

export const calculateNetProfit = async (batch) => {
  const revenue = await calculateTotalRevenue(batch.id);
  const cost = await calculateTotalCost(batch);
  return revenue - cost;
};

export const calculateROI = async (batch) => {
  const netProfit = await calculateNetProfit(batch);
  const cost = await calculateTotalCost(batch);
  return cost > 0 ? (netProfit / cost) * 100 : 0;
};

export const calculateBreakEvenPricePerBird = async (batch) => {
  const totalCost = await calculateTotalCost(batch);
  return batch.initialChicks > 0 ? totalCost / batch.initialChicks : 0;
};

export const calculateBreakEvenPricePerKg = async (batch, finalWeightKg) => {
  const totalCost = await calculateTotalCost(batch);
  const availableBirds = await calculateAvailableBirds(batch);
  const totalWeightGain = availableBirds * (finalWeightKg - (batch.initialWeightKg || 0));
  return totalWeightGain > 0 ? totalCost / totalWeightGain : 0;
};

export const calculateAverageSalePricePerBird = async (batchId) => {
  const result = db.getFirstSync(
    `SELECT AVG(price) AS avgPrice FROM sales WHERE projectId=? AND batchId=? AND saleType='per_bird'`,
    [getActiveProjectId(), batchId]
  );
  return result?.avgPrice || 0;
};

export const calculateAverageSalePricePerKg = async (batchId) => {
  const result = db.getFirstSync(
    `SELECT AVG(price) AS avgPrice FROM sales WHERE projectId=? AND batchId=? AND saleType='per_kg'`,
    [getActiveProjectId(), batchId]
  );
  return result?.avgPrice || 0;
};

export const calculateTotalMortality = async (batchId) => getMortalityByBatch(batchId);

export const calculateMortalityRate = async (batch) => {
  const totalDead = await calculateTotalMortality(batch.id);
  return batch.initialChicks > 0 ? (totalDead / batch.initialChicks) * 100 : 0;
};

export const calculateAverageDailyMortality = async (batch) => {
  const totalDead = await calculateTotalMortality(batch.id);
  const days = (new Date() - new Date(batch.startDate)) / (1000 * 60 * 60 * 24);
  return days > 0 ? totalDead / days : 0;
};

export const calculateTotalFeedConsumed = async (batchId) => {
  const feed = getFeedByBatch(batchId);
  return feed.reduce((sum, item) => sum + item.quantityKg, 0);
};

export const calculateAverageFeedConsumptionPerBird = async (batch) => {
  const totalFeedKg = await calculateTotalFeedConsumed(batch.id);
  const availableBirds = await calculateAvailableBirds(batch);
  return availableBirds > 0 ? totalFeedKg / availableBirds : 0;
};

export const calculateAverageWeightPerBird = async (batch, finalWeightKg) => {
  const availableBirds = await calculateAvailableBirds(batch);
  return availableBirds > 0 ? finalWeightKg : 0;
};

export const calculateTotalBirdsSold = async (batchId) => {
  const result = db.getFirstSync(
    `SELECT SUM(quantity) AS totalSold FROM sales WHERE projectId=? AND batchId=? AND saleType='per_bird'`,
    [getActiveProjectId(), batchId]
  );
  return result?.totalSold || 0;
};

export const calculateTotalWeightSold = async (batchId) => {
  const result = db.getFirstSync(
    `SELECT SUM(quantity) AS totalWeight FROM sales WHERE projectId=? AND batchId=? AND saleType='per_kg'`,
    [getActiveProjectId(), batchId]
  );
  return result?.totalWeight || 0;
};

export const calculateAveragePricePerKgOfFeed = async (batchId) => {
  const feed = getFeedByBatch(batchId);
  const totalQuantity = feed.reduce((sum, item) => sum + item.quantityKg, 0);
  const totalCost = feed.reduce((sum, item) => sum + item.quantityKg * item.pricePerKg, 0);
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
};

export const calculateTotalDaysInProduction = (startDate) => {
  const days = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : 0;
};