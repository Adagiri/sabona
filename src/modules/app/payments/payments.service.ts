import { Injectable } from "@nestjs/common";
import CreatePaymentRequestDTO from "./dto/request/createPayment.request";
import DatabaseService from "src/database/database.service";
import { BadRequestException } from "src/core/exceptions/response.exception";
import { OrderStatus, PaymentTransactionType } from "@prisma/client";

@Injectable()
export default class PaymentsService {
    constructor(private _databaseService: DatabaseService) {}
  
    async createPayment(data: CreatePaymentRequestDTO) {
        const payment=  await this._databaseService.payment.create({
            data: {
                paymentType: data.paymentType,
                orderId:data.paymentType === PaymentTransactionType.ORDER  ? data.orderId :null,
                tipTransactionId:data.paymentType === PaymentTransactionType.TIP ? data.tipTransactionId :null,
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
        
        if (data.paymentType === PaymentTransactionType.ORDER){
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
        }else if (data.paymentType === PaymentTransactionType.TIP){
            const updatedTip = await this._databaseService.tip.updateMany({
                where: {
                    transactionId: data.tipTransactionId
                },
                data: {
                    paid: true,
                }
            })
             
            if (!updatedTip) {
                throw new BadRequestException("Tip not updated");
            }
        }

        

        return payment;
    }
   
}