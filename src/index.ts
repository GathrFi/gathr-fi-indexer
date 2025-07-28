import { ponder } from "ponder:registry";
import {
  userStats,
  userActivities,
  groups,
  expenses,
  expenseSplits,
} from "ponder:schema";

ponder.on("GathrFi:FundsDeposited", async ({ event, context }) => {
  const { client, contracts, db } = context;
  const { user, amount } = event.args;

  try {
    const yieldAmount = (await client.readContract({
      address: contracts.MockAavePool.address,
      abi: contracts.MockAavePool.abi,
      functionName: "getUserYield",
      args: [user],
    })) as bigint;

    await db
      .insert(userStats)
      .values({
        id: user,
        balance: amount,
        yieldPercentage: BigInt(500), // APY in basis points (e.g., 500 = 5%)
        yieldAmount, // Total yield earned
      })
      .onConflictDoUpdate((row) => ({
        balance: row.balance + amount,
        yieldPercentage: row.yieldPercentage,
        yieldAmount,
      }));

    await db.insert(userActivities).values({
      id: event.transaction.hash,
      user,
      type: "DEPOSIT",
      amount,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });
  } catch (error) {
    console.error(`Failed to process FundsDeposited for user ${user}:`, error);
  }
});

ponder.on("GathrFi:FundsWithdrawn", async ({ event, context }) => {
  const { client, contracts, db } = context;
  const { user, amount } = event.args;

  try {
    const yieldAmount = (await client.readContract({
      address: contracts.MockAavePool.address,
      abi: contracts.MockAavePool.abi,
      functionName: "getUserYield",
      args: [user],
    })) as bigint;

    await db.update(userStats, { id: user }).set((row) => ({
      balance: row.balance - amount,
      yieldPercentage: row.yieldPercentage,
      yieldAmount,
    }));

    await db.insert(userActivities).values({
      id: event.transaction.hash,
      user,
      type: "WITHDRAW",
      amount,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });
  } catch (error) {
    console.error(`Failed to process FundsWithdrawn for user ${user}:`, error);
  }
});

ponder.on("GathrFi:GroupCreated", async ({ event, context }) => {
  const { db } = context;
  const { groupId, name, admin, members } = event.args;

  await context.db
    .insert(groups)
    .values({ id: groupId, name, admin, members: [...members] });

  await db.insert(userActivities).values({
    id: event.transaction.hash,
    user: admin,
    type: "ADD_GROUP",
    groupId,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  for (const member of members) {
    await db.insert(userActivities).values({
      id: event.transaction.hash,
      user: member,
      type: "ADD_GROUP",
      groupId,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });
  }
});

ponder.on("GathrFi:ExpenseAdded", async ({ event, context }) => {
  const { db } = context;
  const { groupId, expenseId, payer, amount, description } = event.args;

  await db.insert(expenses).values({
    groupId,
    expenseId,
    payer,
    amount,
    settledAmount: BigInt(0),
    description,
    fullySettled: false,
  });

  await db.insert(userActivities).values({
    id: event.transaction.hash,
    user: payer,
    type: "ADD_EXPENSE",
    groupId,
    expenseId,
    amount,
    description,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("GathrFi:ExpenseSplit", async ({ event, context }) => {
  const { db } = context;
  const { groupId, expenseId, splitMembers, splitAmounts } = event.args;

  const payer = (await db.find(expenses, { groupId, expenseId }))?.payer;

  for (let i = 0; i < splitMembers.length; i++) {
    await db.insert(expenseSplits).values({
      groupId,
      expenseId,
      member: splitMembers[i] as `0x${string}`,
      amount: splitAmounts[i] as bigint,
      settled: splitMembers[i] === payer,
    });
  }
});

ponder.on("GathrFi:ExpenseSettled", async ({ event, context }) => {
  const { db } = context;
  const { groupId, expenseId, member, amount } = event.args;

  const expense = await db.find(expenses, { groupId, expenseId });
  if (expense == null) return;

  const settledAmount = expense.settledAmount + amount;
  const fullySettled = settledAmount >= expense.amount;

  await db
    .update(expenseSplits, { groupId, expenseId, member })
    .set({ settled: true });

  await db
    .update(expenses, { groupId, expenseId })
    .set({ settledAmount, fullySettled });

  await db.insert(userActivities).values({
    id: event.transaction.hash,
    user: member,
    type: "SETTLE_EXPENSE",
    groupId,
    expenseId,
    amount,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await db.update(userStats, { id: member }).set((row) => ({
    balance: row.balance - amount,
  }));
  await db.update(userStats, { id: expense?.payer }).set((row) => ({
    balance: row.balance - amount,
  }));
});
