import {
  Mutation,
  MutationAdminAuthenticateArgs,
  MutationAdminKycApproveUserArgs,
  MutationAdminKycRejectUserArgs,
  MutationAuthenticateArgs,
  MutationCreateBitcoinAccountArgs,
  MutationCreateTransactionArgs,
  MutationSendEmailVerificationCodeArgs,
  MutationSendPhoneNumberVerificationCodeArgs,
  MutationSetBankAccountArgs,
  MutationSetPasswordArgs,
  MutationUploadGovernmentIdArgs,
  MutationVerifyEmailArgs,
  MutationVerifyPhoneNumberArgs,
  Query,
  QueryAdminGetUserArgs,
  QueryGetBanksByCountryArgs,
  QueryGetCurrenciesByCountryArgs,
} from "@ibexcm/libraries/api";
import { GetBanksByCountryQuery } from "@ibexcm/libraries/api/bank";
import { CreateBitcoinAccountMutation } from "@ibexcm/libraries/api/cryptoAccount";
import { GetCurrenciesByCountryQuery } from "@ibexcm/libraries/api/currency";
import {
  AdminGetUsersWithPendingKYCApprovalQuery,
  AdminKYCApproveUserMutation,
  AdminKYCRejectUserMutation,
} from "@ibexcm/libraries/api/kyc";
import { CreateTransactionMutation } from "@ibexcm/libraries/api/transaction";
import {
  AdminAuthenticateMutation,
  AdminGetUserQuery,
  AuthenticateMutation,
  SendEmailVerificationCodeMutation,
  SendPhoneNumberVerificationCodeMutation,
  SetBankAccountMutation,
  SetPasswordMutation,
  UploadGovernmentIDMutation,
  UserQuery,
  VerifyEmailMutation,
  VerifyPhoneNumberMutation,
} from "@ibexcm/libraries/api/user";
import { ApolloError } from "apollo-server-errors";
import axios from "axios";
import { print } from "graphql";
import { config } from "../../config";

const { port, address } = config.get("express");

const headers = (authToken?: string) => {
  let headers = {
    "Content-Type": "application/json",
  };

  if (!Boolean(authToken)) {
    return headers;
  }

  return { ...headers, Authorization: `Bearer ${authToken}` };
};

const query = async <TVariables, TResponse>(
  query,
  variables?: TVariables,
  authToken?: string,
): Promise<{ data?: TResponse; errors?: ApolloError[] }> => {
  const { data } = await axios(`http://${address}:${port}/graphql`, {
    method: "POST",
    headers: headers(authToken),
    data: {
      query: print(query),
      variables,
    },
  });

  return data;
};

const authenticate = async (args: MutationAuthenticateArgs) => {
  return query<MutationAuthenticateArgs, Pick<Mutation, "authenticate">>(
    AuthenticateMutation,
    args,
  );
};

const adminAuthenticate = async (args: MutationAdminAuthenticateArgs) => {
  return query<MutationAdminAuthenticateArgs, Pick<Mutation, "adminAuthenticate">>(
    AdminAuthenticateMutation,
    args,
  );
};

const adminGetUsersWithPendingKYCApproval = async (authToken: string) => {
  return query<void, Pick<Query, "adminGetUsersWithPendingKYCApproval">>(
    AdminGetUsersWithPendingKYCApprovalQuery,
    null,
    authToken,
  );
};

const user = async (authToken: string) => {
  return query<void, Pick<Query, "user">>(UserQuery, undefined, authToken);
};

const adminGetUser = async (args: QueryAdminGetUserArgs, authToken: string) => {
  return query<QueryAdminGetUserArgs, Pick<Query, "adminGetUser">>(
    AdminGetUserQuery,
    args,
    authToken,
  );
};

const getBanksByCountry = async (args: QueryGetBanksByCountryArgs) => {
  return query<QueryGetBanksByCountryArgs, Pick<Query, "getBanksByCountry">>(
    GetBanksByCountryQuery,
    args,
  );
};

const getCurrenciesByCountry = async (args: QueryGetCurrenciesByCountryArgs) => {
  return query<QueryGetCurrenciesByCountryArgs, Pick<Query, "getCurrenciesByCountry">>(
    GetCurrenciesByCountryQuery,
    args,
  );
};

const verifyPhoneNumber = async (args: MutationVerifyPhoneNumberArgs) => {
  return query<MutationVerifyPhoneNumberArgs, Pick<Mutation, "verifyPhoneNumber">>(
    VerifyPhoneNumberMutation,
    args,
  );
};

const sendPhoneNumberVerificationCode = async (
  args: MutationSendPhoneNumberVerificationCodeArgs,
) => {
  return query<
    MutationSendPhoneNumberVerificationCodeArgs,
    Pick<Mutation, "sendPhoneNumberVerificationCode">
  >(SendPhoneNumberVerificationCodeMutation, args);
};

const sendEmailVerificationCode = async (args: MutationSendEmailVerificationCodeArgs) => {
  return query<
    MutationSendEmailVerificationCodeArgs,
    Pick<Mutation, "sendEmailVerificationCode">
  >(SendEmailVerificationCodeMutation, args);
};

const verifyEmail = async (args: MutationVerifyEmailArgs, authToken: string) => {
  return query<MutationVerifyEmailArgs, Pick<Mutation, "verifyEmail">>(
    VerifyEmailMutation,
    args,
    authToken,
  );
};

const setPassword = async (args: MutationSetPasswordArgs, authToken: string) => {
  return query<MutationSetPasswordArgs, Pick<Mutation, "setPassword">>(
    SetPasswordMutation,
    args,
    authToken,
  );
};

const uploadGovernmentID = async (
  args: MutationUploadGovernmentIdArgs,
  authToken: string,
) => {
  return query<MutationUploadGovernmentIdArgs, Pick<Mutation, "uploadGovernmentID">>(
    UploadGovernmentIDMutation,
    args,
    authToken,
  );
};

const setBankAccount = async (args: MutationSetBankAccountArgs, authToken: string) => {
  return query<MutationSetBankAccountArgs, Pick<Mutation, "setBankAccount">>(
    SetBankAccountMutation,
    args,
    authToken,
  );
};

const adminKYCApproveUser = async (
  args: MutationAdminKycApproveUserArgs,
  authToken: string,
) => {
  return query<MutationAdminKycApproveUserArgs, Pick<Mutation, "adminKYCApproveUser">>(
    AdminKYCApproveUserMutation,
    args,
    authToken,
  );
};

const adminKYCRejectUser = async (
  args: MutationAdminKycRejectUserArgs,
  authToken: string,
) => {
  return query<MutationAdminKycRejectUserArgs, Pick<Mutation, "adminKYCRejectUser">>(
    AdminKYCRejectUserMutation,
    args,
    authToken,
  );
};

const createTransaction = async (
  args: MutationCreateTransactionArgs,
  authToken: string,
) => {
  return query<MutationCreateTransactionArgs, Pick<Mutation, "createTransaction">>(
    CreateTransactionMutation,
    args,
    authToken,
  );
};

const createBitcoinAccount = async (
  args: MutationCreateBitcoinAccountArgs,
  authToken: string,
) => {
  return query<MutationCreateBitcoinAccountArgs, Pick<Mutation, "createBitcoinAccount">>(
    CreateBitcoinAccountMutation,
    args,
    authToken,
  );
};

const GraphQLClient = {
  query,
  authenticate,
  adminAuthenticate,
  adminGetUser,
  user,
  getBanksByCountry,
  getCurrenciesByCountry,
  verifyPhoneNumber,
  sendPhoneNumberVerificationCode,
  sendEmailVerificationCode,
  verifyEmail,
  setPassword,
  uploadGovernmentID,
  setBankAccount,
  adminGetUsersWithPendingKYCApproval,
  adminKYCApproveUser,
  adminKYCRejectUser,
  createTransaction,
  createBitcoinAccount,
};

export default GraphQLClient;
