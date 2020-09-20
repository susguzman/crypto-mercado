import { PhoneNumberUtil } from "google-libphonenumber";

export function isValidPhoneNumber(phoneNumber: string): boolean {
  const Verificator = new PhoneNumberUtil();
  const parsedNumber = Verificator.parse(phoneNumber, "GT");

  return Verificator.isValidNumberForRegion(parsedNumber, "GT");
}
