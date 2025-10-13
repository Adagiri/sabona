import { ForbiddenException, Injectable } from "@nestjs/common";
import { Twilio } from "twilio";
import AppConfig from "../../configs/app.config";
import { VerificationStatus } from "src/constants";

@Injectable()
export default class SMSService {
  private _smsClient: Twilio = null;
  constructor() {
    if (AppConfig.TWILIO.ACCOUNT_SID && AppConfig.TWILIO.AUTH_TOKEN) {
      this._smsClient = new Twilio(
        AppConfig.TWILIO.ACCOUNT_SID,
        AppConfig.TWILIO.AUTH_TOKEN
      );
    }
  }

  async sendVerificationCode(phone: string) {
    try {
      const verification = await this._smsClient.verify.v2.services(AppConfig.TWILIO.VERIFY_SERVICE_SID).verifications.create({
        to: phone,
        channel: 'sms'
      });
      return verification.sid;
    } catch (error) {
      console.log("EROROORORORR", error)
      throw error;
    }
}

async verifyPhoneNumber(
  phoneNumber: string,
  verificationCode: string,
): Promise<any> {
  let verificationCheck;
  try {
    verificationCheck = await this._smsClient.verify.v2.services(AppConfig.TWILIO.VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phoneNumber, code: verificationCode });
  } catch (error) {
    let errorMessage;
    switch (error?.status) {
      case 404:
        errorMessage = 'sms.code_not_found';
        break;
      case 400:
        errorMessage = 'sms.invalid_code';
        break;
      case 429:
        errorMessage = 'sms.max_attempts_reached';
        break;
      default:
        errorMessage = error.message;
        break;
    }
    return errorMessage;
  }
  if (verificationCheck?.status == VerificationStatus.PENDING) {
    throw new ForbiddenException('sms.invalid_code');
  }
  return verificationCheck;
  }

}