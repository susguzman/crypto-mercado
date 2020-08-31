import { InjectionKey, InjectionKeyScope } from "@ibexcm/libraries/di";
import { IEmailAccountRecoveryRepository } from "./interfaces";
import { IEmailNotificationsRepository } from "./interfaces";
import { IEmailVerificationRepository } from "./interfaces";
import { EmailAccountRecoveryRepository } from "./repository";
import { EmailNotificationsRepository } from "./repository";
import { EmailVerificationRepository } from "./repository";

export const emailVerificationRepositoryInjectionKey: InjectionKey<IEmailVerificationRepository> = {
  name: "emailVerificationRepository",
  scope: InjectionKeyScope.singleton,
  closure: _ => EmailVerificationRepository,
};

export const emailNotificationsRepositoryInjectionKey: InjectionKey<IEmailNotificationsRepository> = {
  name: "emailNotificationsRepository",
  scope: InjectionKeyScope.singleton,
  closure: _ => EmailNotificationsRepository,
};

export const emailRecoveryAccountRepositoryInjectionKey: InjectionKey<IEmailAccountRecoveryRepository> = {
  name: "emailAccountRecoveryRepository",
  scope: InjectionKeyScope.singleton,
  closure: _ => EmailAccountRecoveryRepository,
};
