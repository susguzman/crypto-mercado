import {
  Prisma,
  RecipientCreateOneWithoutTransactionInput,
  RecipientCreateWithoutTransactionInput,
  Sender,
  SenderCreateOneWithoutTransactionInput,
  Transaction,
  TransactionFeeCreateOneInput,
  TransactionReceiptCreateOneWithoutTransactionInput,
  TransactionReceiptCreateWithoutTransactionInput,
  TransactionTaxCreateOneInput,
  User,
} from "@ibexcm/database";
import {
  BitcoinToFiatTransactionBreakdown,
  CreateTransactionUserInput,
  FiatToBitcoinTransactionBreakdown,
  MutationCreateTransactionArgs,
  QueryAdminGetTransactionsArgs,
  QueryGetTransactionArgs,
  QueryGetTransactionBreakdownArgs,
  TransactionBreakdown,
} from "@ibexcm/libraries/api";
import { CurrencySymbol } from "@ibexcm/libraries/models/currency";
import { IEmailNotificationsRepository } from "../../../libraries/EmailVerification/interfaces/IEmailNotificationsRepository";
import math from "../../../libraries/math";
import { IBitcoinRepository } from "../../Bitcoin/interfaces/IBitcoinRepository";
import { ExchangeRateRepository } from "../../ExchangeRate/repositories/ExchangeRateRepository";
import { TransactionFeeRepository } from "../../TransactionFee/repositories/TransactionFeeRepository";
import { UserRepository } from "../../User/repositories/UserRepository";
import { TransactionError } from "../errors/TransactionError";
import { TransactionTaxRepository } from "./TransactionTaxRepository";

const formatter = Intl.NumberFormat();

export class TransactionRepository {
  private db: Prisma;
  private emailNotificationsRepository: IEmailNotificationsRepository;
  private BitcoinRepository: IBitcoinRepository;
  private TransactionFeeRepository: TransactionFeeRepository;
  private UserRepository: UserRepository;
  private TransactionTaxRepository: TransactionTaxRepository;
  private ExchangeRateRepository: ExchangeRateRepository;

  constructor(
    db: Prisma,
    emailNotificationsRepository: IEmailNotificationsRepository,
    BitcoinRepository: IBitcoinRepository,
    TransactionFeeRepository: TransactionFeeRepository,
    TransactionTaxRepository: TransactionTaxRepository,
    ExchangeRateRepository: ExchangeRateRepository,
    UserRepository: UserRepository,
  ) {
    this.db = db;
    this.emailNotificationsRepository = emailNotificationsRepository;
    this.BitcoinRepository = BitcoinRepository;
    this.TransactionFeeRepository = TransactionFeeRepository;
    this.TransactionTaxRepository = TransactionTaxRepository;
    this.ExchangeRateRepository = ExchangeRateRepository;
    this.UserRepository = UserRepository;
  }

  async adminGetTransactions({
    args,
  }: QueryAdminGetTransactionsArgs): Promise<Transaction[]> {
    return await this.db.transactions(args);
  }

  async getTransaction({
    args: { transactionID },
  }: QueryGetTransactionArgs): Promise<Transaction> {
    const transactionExists = await this.db.$exists.transaction({ id: transactionID });
    if (!transactionExists) {
      throw TransactionError.transactionDoesNotExist;
    }

    return await this.db.transaction({ id: transactionID });
  }

  async getTransactionBreakdown(
    args: QueryGetTransactionBreakdownArgs,
    senderUser: User,
  ): Promise<TransactionBreakdown> {
    const {
      args: { amount, sender },
    } = args;

    if (Boolean(sender.bankAccountID)) {
      return this.getBitcoinToFiatTransactionBreakdown(args, senderUser);
    }

    return this.getFiatToBitcoinTransactionBreakdown(args, senderUser);
  }

  async createTransaction(
    args: MutationCreateTransactionArgs,
    senderUser: User,
  ): Promise<Transaction> {
    const sender = this.getOnCreateTransactionSender(senderUser, args);
    const recipient = await this.getOnCreateTransactionRecipient(args);
    const receipt = await this.getTransactionReceipt(senderUser, args);

    const { args: input } = args;

    const amount = input?.amount || "0.00";

    const transaction = await this.db.createTransaction({
      amount,
      receipt,
      recipient,
      sender,
    });

    await this.db.updateUser({
      where: {
        id: senderUser.id,
      },
      data: {
        transactions: {
          connect: {
            id: transaction.id,
          },
        },
      },
    });

    return transaction;
  }

  async sender(id: string): Promise<Sender> {
    return await this.db.transaction({ id }).sender();
  }

  async recipient(id: string): Promise<Sender> {
    return await this.db.transaction({ id }).recipient();
  }

  async receipt(id: string): Promise<Sender> {
    return await this.db.transaction({ id }).receipt();
  }

  private async getFiatToBitcoinTransactionBreakdown(
    args: QueryGetTransactionBreakdownArgs,
    senderUser: User,
  ): Promise<FiatToBitcoinTransactionBreakdown> {
    const {
      args: { amount: inputAmount, sender, recipient },
    } = args;

    const country = await this.db
      .user({ id: senderUser.id })
      .profile()
      .country();

    const currency = await this.db.bankAccount({ id: recipient.bankAccountID }).currency();

    const {
      symbol: currentPriceSymbol,
      price: currentPrice,
    } = await this.BitcoinRepository.getCurrentPriceByCurrencySymbol(
      currency.symbol as CurrencySymbol,
    );

    const price = {
      key: "Precio actual BTC",
      value: `${currentPriceSymbol} ${formatter.format(Number(currentPrice))}`,
    };

    const amountByCurrentPrice = math.divide(Number(inputAmount), Number(currentPrice));

    const amount = {
      key: "Cantidad",
      value: `${CurrencySymbol.BTC} ${formatter.format(amountByCurrentPrice)}`,
    };

    const { fee: assignedFee } = await this.TransactionFeeRepository.calculate(senderUser);
    const calculatedFee = math.multiply(amountByCurrentPrice, Number(assignedFee));
    const fee = {
      key: `Comisión IBEX (${math.multiply(Number(assignedFee), 100).toFixed(1)}%)`,
      value: `${CurrencySymbol.BTC} ${formatter.format(calculatedFee)}`,
    };

    const assignedTaxByCountry = this.TransactionTaxRepository.getTaxByCountry(country);
    const calculatedTax = math.multiply(calculatedFee, Number(assignedTaxByCountry));
    const tax = {
      key: `IVA (${math.multiply(Number(assignedTaxByCountry), 100).toFixed(1)}%)`,
      value: `${CurrencySymbol.BTC} ${formatter.format(calculatedTax)}`,
    };

    const subtotal = math
      .chain(amountByCurrentPrice)
      .subtract(calculatedFee)
      .subtract(calculatedTax)
      .done();

    const total = {
      key: "Total",
      value: `${CurrencySymbol.BTC} ${formatter.format(subtotal)}`,
    };

    return {
      __typename: "FiatToBitcoinTransactionBreakdown",
      price,
      amount,
      fee,
      tax,
      total,
    };
  }

  private async getBitcoinToFiatTransactionBreakdown(
    args: QueryGetTransactionBreakdownArgs,
    senderUser: User,
  ): Promise<BitcoinToFiatTransactionBreakdown> {
    const {
      args: { amount: inputAmount, sender },
    } = args;

    const country = await this.db
      .user({ id: senderUser.id })
      .profile()
      .country();

    const currency = await this.db.bankAccount({ id: sender.bankAccountID }).currency();

    const {
      symbol: currentPriceSymbol,
      price: currentPrice,
    } = await this.BitcoinRepository.getCurrentPriceByCurrencySymbol();

    const price = {
      key: "Precio actual BTC",
      value: `${currentPriceSymbol} ${formatter.format(Number(currentPrice))}`,
    };

    const amountByCurrentPrice = math.multiply(Number(currentPrice), Number(inputAmount));

    const amount = {
      key: "Cantidad",
      value: `${currentPriceSymbol} ${formatter.format(amountByCurrentPrice)}`,
    };

    const { fee: assignedFee } = await this.TransactionFeeRepository.calculate(senderUser);
    const calculatedFee = math.multiply(amountByCurrentPrice, Number(assignedFee));
    const fee = {
      key: `Comisión IBEX (${math.multiply(Number(assignedFee), 100).toFixed(1)}%)`,
      value: `${currentPriceSymbol} ${formatter.format(calculatedFee)}`,
    };

    const assignedTaxByCountry = this.TransactionTaxRepository.getTaxByCountry(country);
    const calculatedTax = math.multiply(calculatedFee, Number(assignedTaxByCountry));
    const tax = {
      key: `IVA (${math.multiply(Number(assignedTaxByCountry), 100).toFixed(1)}%)`,
      value: `${currentPriceSymbol} ${formatter.format(calculatedTax)}`,
    };

    const subtotal = math
      .chain(amountByCurrentPrice)
      .subtract(calculatedFee)
      .subtract(calculatedTax)
      .done();
    const total = {
      key: "Recibes",
      value: `${currentPriceSymbol} ${formatter.format(subtotal)}`,
    };

    let exchangeRate;
    if (currency.symbol !== CurrencySymbol.USD) {
      const {
        price: exchangeRatePrice,
      } = await this.ExchangeRateRepository.getLatestByCurrency(currency);
      const calculatedExchangeRate = math.multiply(subtotal, Number(exchangeRatePrice));
      exchangeRate = {
        key: `Tipo de cambio (${exchangeRatePrice})`,
        value: `${currency.symbol} ${formatter.format(calculatedExchangeRate)}`,
      };
    }

    return {
      __typename: "BitcoinToFiatTransactionBreakdown",
      price,
      amount,
      fee,
      tax,
      total,
      exchangeRate,
    };
  }

  private async getTaxByCurrency({
    bankAccountID,
    cryptoAccountID,
  }: CreateTransactionUserInput): Promise<string> {
    const currency = Boolean(bankAccountID)
      ? await this.db.bankAccount({ id: bankAccountID }).currency()
      : await this.db.cryptoAccount({ id: cryptoAccountID }).currency();
    return this.TransactionTaxRepository.getTaxByCurrency(currency);
  }

  private async getTransactionReceipt(
    senderUser: User,
    args: MutationCreateTransactionArgs,
  ): Promise<TransactionReceiptCreateOneWithoutTransactionInput> {
    const {
      args: { sender, recipient },
    } = args;

    const { fee } = await this.TransactionFeeRepository.calculate(senderUser);

    const tax = await this.getTaxByCurrency(sender);

    const createFee = {
      fee: {
        create: {
          fee,
        },
      } as TransactionFeeCreateOneInput,
    };

    const createTax = {
      tax: {
        create: {
          tax,
        },
      } as TransactionTaxCreateOneInput,
    };

    if (Boolean(sender.bankAccountID)) {
      const toCurrency = await this.db.bankAccount({ id: sender.bankAccountID }).currency();

      const createCurrencies = {
        toCurrency: {
          connect: {
            id: toCurrency.id,
          },
        },
        fromCurrency: {
          connect: {
            symbol: CurrencySymbol.BTC,
          },
        },
      };

      const create = {
        ...createFee,
        ...createTax,
        ...createCurrencies,
      } as TransactionReceiptCreateWithoutTransactionInput;

      if (toCurrency.symbol !== CurrencySymbol.USD) {
        const [{ id: exchangeRateID }] = await this.db.exchangeRates({
          where: { currency: { symbol: toCurrency.symbol } },
          orderBy: "createdAt_DESC",
          first: 1,
        });

        create.exchangeRate = {
          connect: {
            id: exchangeRateID,
          },
        };
      }

      return { create };
    }

    const toCurrency = await this.db
      .cryptoAccount({ id: sender.cryptoAccountID })
      .currency();

    const fromCurrency = await this.db
      .bankAccount({ id: recipient.bankAccountID })
      .currency();

    const createCurrencies = {
      toCurrency: {
        connect: {
          id: toCurrency.id,
        },
      },
      fromCurrency: {
        connect: {
          id: fromCurrency.id,
        },
      },
    };

    return {
      create: {
        ...createFee,
        ...createTax,
        ...createCurrencies,
      },
    };
  }

  private async getRecipientTargetAccount(
    recipientUser: User,
    { args: { sender, recipient } }: MutationCreateTransactionArgs,
  ): Promise<
    | Pick<RecipientCreateWithoutTransactionInput, "bankAccount">
    | Pick<RecipientCreateWithoutTransactionInput, "cryptoAccount">
  > {
    if (Boolean(sender.bankAccountID)) {
      const [{ id }] = await this.db.user({ id: recipientUser.id }).cryptoAccounts();
      return {
        cryptoAccount: {
          connect: {
            id,
          },
        },
      };
    }

    return {
      bankAccount: {
        connect: {
          id: recipient.bankAccountID,
        },
      },
    };
  }

  private async getOnCreateTransactionRecipient(
    args: MutationCreateTransactionArgs,
  ): Promise<RecipientCreateOneWithoutTransactionInput> {
    const recipientUser = await this.UserRepository.getDefaultAdminUser();

    const recipient: RecipientCreateOneWithoutTransactionInput = {
      create: {
        user: {
          connect: {
            id: recipientUser.id,
          },
        },
      },
    };

    const targetAccount = await this.getRecipientTargetAccount(recipientUser, args);

    recipient.create = {
      ...recipient.create,
      ...targetAccount,
    };

    return recipient;
  }

  private getOnCreateTransactionSender(
    senderUser: User,
    { args: { sender: transactionSender } }: MutationCreateTransactionArgs,
  ): SenderCreateOneWithoutTransactionInput {
    const sender: SenderCreateOneWithoutTransactionInput = {
      create: {
        user: {
          connect: {
            id: senderUser.id,
          },
        },
      },
    };

    if (Boolean(transactionSender.bankAccountID)) {
      return {
        create: {
          user: {
            ...sender.create.user,
          },
          bankAccount: {
            connect: {
              id: transactionSender.bankAccountID,
            },
          },
        },
      };
    }

    return {
      create: {
        user: {
          ...sender.create.user,
        },
        cryptoAccount: {
          connect: {
            id: transactionSender.cryptoAccountID,
          },
        },
      },
    };
  }
}