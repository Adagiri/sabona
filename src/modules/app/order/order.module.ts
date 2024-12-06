import { Module } from "@nestjs/common";
import DatabaseModule from "src/database/database.module";
import OrderService from "./order.service";
import OrderController from "./order.controller";
@Module({
    imports: [DatabaseModule],
    exports: [OrderService],
    providers: [OrderService],
    controllers: [OrderController],
})
export default class OrderModule {}