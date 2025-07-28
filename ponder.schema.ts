import { onchainEnum, onchainTable, index, primaryKey } from "ponder";

// User Statistics
export const userStats = onchainTable("user_stats", (t) => ({
  id: t.hex().primaryKey(), // User address
  balance: t.bigint().notNull(),
  yieldPercentage: t.bigint().notNull(),
  yieldAmount: t.bigint().notNull(),
}));

export const userActivityType = onchainEnum("activity_type", [
  "DEPOSIT",
  "WITHDRAW",
  "ADD_GROUP",
  "ADD_EXPENSE",
  "SETTLE_EXPENSE",
]);

// User Activities
export const userActivities = onchainTable(
  "user_activities",
  (t) => ({
    id: t.hex().notNull(), // Transaction hash (avoid collisions)
    user: t.hex().notNull(), // User address (provide uniqueness)
    type: userActivityType("type").notNull(),
    groupId: t.bigint(), // Optional, for group-related activities
    expenseId: t.bigint(), // Optional, for expense-related activities
    amount: t.bigint(), // Optional, for deposit/withdraw/expense
    description: t.text(), // Optional, for expense description
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.user] }),
    userIdx: index().on(table.user),
    typeIdx: index().on(table.type),
    timestampIdx: index().on(table.timestamp),
  })
);

// Groups
export const groups = onchainTable(
  "groups",
  (t) => ({
    id: t.bigint().primaryKey(), // Group id
    name: t.text().notNull(),
    admin: t.hex().notNull(),
    members: t.hex().array().notNull(),
  }),
  (table) => ({
    adminIdx: index().on(table.admin),
  })
);

// Expenses
export const expenses = onchainTable(
  "expenses",
  (t) => ({
    groupId: t.bigint().notNull(),
    expenseId: t.bigint().notNull(),
    payer: t.hex().notNull(),
    amount: t.bigint().notNull(),
    settledAmount: t.bigint().notNull(),
    description: t.text().notNull(),
    fullySettled: t.boolean().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.expenseId] }),
    groupIdx: index().on(table.groupId),
    payerIdx: index().on(table.payer),
  })
);

// Expense Splits
export const expenseSplits = onchainTable(
  "expense_splits",
  (t) => ({
    groupId: t.bigint().notNull(),
    expenseId: t.bigint().notNull(),
    member: t.hex().notNull(),
    amount: t.bigint().notNull(),
    settled: t.boolean().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.expenseId, table.member] }),
    groupIdx: index().on(table.groupId),
    memberIdx: index().on(table.member),
  })
);
