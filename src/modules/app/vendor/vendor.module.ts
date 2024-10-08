import { Module } from "@nestjs/common";
import DatabaseModule from "src/database/database.module";
import VendorService from "./vendor.service";
import VendorController from "./vendor.controller";

@Module({
    imports:[DatabaseModule],
    exports: [VendorService],
    providers: [VendorService],
    controllers: [VendorController]
})

export default class VendorModule {}