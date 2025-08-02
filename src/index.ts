import { ponder } from "ponder:registry";
import {
  userActivities,
  groups,
  expenses,
  expenseSplits,
  instantExpenses,
  instantExpenseSplits,
} from "ponder:schema";

ponder.on("GathrFi:GroupCreated", async ({ event, context }) => {
  const { db } = context;
  const { groupId, name, admin, members } = event.args;

  await db
    .insert(groups)
    .values({ id: groupId, name, admin, members: [...members] });

  await db.insert(userActivities).values({
    id: `${event.transaction.hash}-${groupId}-admin`,
    user: admin,
    type: "ADD_GROUP",
    groupId,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  for (let i = 0; i < members.length; i++) {
    await db.insert(userActivities).values({
      id: `${event.transaction.hash}-${groupId}-member-${i}`,
      user: members[i] as `0x${string}`,
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

  const expense = await db.find(expenses, { groupId, expenseId });
  const payer = expense?.payer;

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
});

ponder.on("GathrFi:InstantExpenseAdded", async ({ event, context }) => {
  const { db } = context;
  const { expenseId, payer, amount, description, splitMembers, splitAmounts } = event.args;

  await db.insert(instantExpenses).values({
    expenseId,
    payer,
    amount,
    settledAmount: BigInt(0),
    description,
    fullySettled: false,
    timestamp: event.block.timestamp,
  });

  for (let i = 0; i < splitMembers.length; i++) {
    await db.insert(instantExpenseSplits).values({
      expenseId,
      member: splitMembers[i] as `0x${string}`,
      amount: splitAmounts[i] as bigint,
      settled: splitMembers[i] === payer,
    });
  }

  await db.insert(userActivities).values({
    id: event.transaction.hash,
    user: payer,
    type: "ADD_INSTANT_EXPENSE",
    expenseId,
    amount,
    description,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("GathrFi:InstantExpenseSettled", async ({ event, context }) => {
  const { db } = context;
  const { expenseId, member, amount } = event.args;

  const expense = await db.find(instantExpenses, { expenseId });
  if (expense == null) return;

  const settledAmount = expense.settledAmount + amount;
  const fullySettled = settledAmount >= expense.amount;

  await db
    .update(instantExpenseSplits, { expenseId, member })
    .set({ settled: true });

  await db
    .update(instantExpenses, { expenseId })
    .set({ settledAmount, fullySettled });

  await db.insert(userActivities).values({
    id: event.transaction.hash,
    user: member,
    type: "SETTLE_INSTANT_EXPENSE",
    expenseId,
    amount,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});