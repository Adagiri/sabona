import { Module } from "@nestjs/common";
import PaymentsService from "./payments.service";
import PaymentsController from "./payments.controller";
import DatabaseModule from "src/database/database.module";

@Module({
    imports: [DatabaseModule],
    exports: [PaymentsService],
    providers: [PaymentsService],
    controllers: [PaymentsController],
})
export default class PaymentsModule {}