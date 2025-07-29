import { Module } from "@nestjs/common";
import DatabaseModule from "src/database/database.module";
import VendorService from "./vendor.service";
import VendorController from "./vendor.controller";
import { NotificationModule } from "../notification/notification.module";
import VendorOnboardingService from "./vendor-onboarding.service";
import VendorOnboardingController from "./vendor-onboarding.controller";
import SMSModule from "src/modules/sms/sms.module";
import AuthModule from "../auth/auth.module";

@Module({
    imports: [
        DatabaseModule,
        NotificationModule,
        DatabaseModule,
        SMSModule,
        AuthModule
    ],
    exports: [VendorService, VendorOnboardingService],
    providers: [VendorService, VendorOnboardingService],
    controllers: [VendorController, VendorOnboardingController],
})
export default class VendorModule {}