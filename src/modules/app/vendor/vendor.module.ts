import { Module } from "@nestjs/common";
import DatabaseModule from "src/database/database.module";
import VendorService from "./vendor.service";
import VendorController from "./vendor.controller";
import { NotificationModule } from "../notification/notification.module";

@Module({
    imports:[DatabaseModule , NotificationModule],
    exports: [VendorService],
    providers: [VendorService],
    controllers: [VendorController]
})

export default class VendorModule {}