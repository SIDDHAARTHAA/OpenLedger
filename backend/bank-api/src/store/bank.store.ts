export type BankOrderStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface BankOrder {
  token: string;
  ref: string;
  amount: bigint;
  returnUrl: string;
  status: BankOrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bankOrders = new Map<string, BankOrder>();

export const createBankOrder = (input: {
  token: string;
  ref: string;
  amount: bigint;
  returnUrl: string;
}) => {
  const order: BankOrder = {
    ...input,
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  bankOrders.set(order.token, order);
  return order;
};

export const getBankOrder = (token: string) => {
  return bankOrders.get(token);
};

export const updateBankOrderStatus = (token: string, status: BankOrderStatus) => {
  const order = bankOrders.get(token);

  if (!order) {
    return null;
  }

  order.status = status;
  order.updatedAt = new Date();

  return order;
};
