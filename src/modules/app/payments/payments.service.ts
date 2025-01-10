import { Injectable } from "@nestjs/common";
import CreatePaymentRequestDTO from "./dto/request/createPayment.request";
import DatabaseService from "src/database/database.service";
import { BadRequestException } from "src/core/exceptions/response.exception";
import { OrderStatus } from "@prisma/client";

@Injectable()
export default class PaymentsService {
    constructor(private _databaseService: DatabaseService) {}
  
    async createPayment(data: CreatePaymentRequestDTO) {
        const payment=  await this._databaseService.payment.create({
            data: {
                orderId: data.orderId,
                transactionRef: data.transactionRef,
                amount: data.amount,
                type: data.type,
                status: data.status,
                paymentMethod: data.paymentMethod
            }
        })
        if (!payment) {
            throw new BadRequestException("Payment not created");
        }

        const updatedOrder = await this._databaseService.order.update({
            where: {
                id: data.orderId
            },
            data: {
                paid: true,
                status: OrderStatus.PENDING,
            }
        })
         
        if (!updatedOrder) {
            throw new BadRequestException("Order not updated");
        }

        return payment;
    }
   
}