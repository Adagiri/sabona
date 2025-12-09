export interface NotificationTemplate {
    en: {
        title: string;
        body: string;
    };
    ar: {
        title: string;
        body: string;
    };
}

export const NOTIFICATION_TEMPLATES = {
    // Order notifications for customers
    ORDER_PLACED: {
        en: {
            title: 'Order Placed',
            body: 'Your order has been placed successfully',
        },
        ar: {
            title: 'تم تقديم الطلب',
            body: 'تم تقديم طلبك بنجاح',
        },
    },
    ORDER_ACCEPTED: {
        en: {
            title: 'Order Accepted',
            body: 'Your order has been accepted by the vendor',
        },
        ar: {
            title: 'تم قبول الطلب',
            body: 'تم قبول طلبك من قبل المغسلة',
        },
    },
    ORDER_REJECTED: {
        en: {
            title: 'Order Rejected',
            body: 'Your order has been rejected',
        },
        ar: {
            title: 'تم رفض الطلب',
            body: 'تم رفض طلبك',
        },
    },
    ORDER_IN_PROGRESS: {
        en: {
            title: 'Order In Progress',
            body: 'Your order is being processed',
        },
        ar: {
            title: 'الطلب قيد المعالجة',
            body: 'طلبك قيد المعالجة',
        },
    },
    ORDER_READY_FOR_PICKUP: {
        en: {
            title: 'Order Ready',
            body: 'Your order is ready for pickup',
        },
        ar: {
            title: 'الطلب جاهز',
            body: 'طلبك جاهز للاستلام',
        },
    },
    ORDER_PICKED_UP: {
        en: {
            title: 'Order Picked Up',
            body: 'Your order has been picked up by the rider',
        },
        ar: {
            title: 'تم استلام الطلب',
            body: 'تم استلام طلبك من قبل السائق',
        },
    },
    ORDER_DELIVERED: {
        en: {
            title: 'Order Delivered',
            body: 'Your order has been delivered successfully',
        },
        ar: {
            title: 'تم توصيل الطلب',
            body: 'تم توصيل طلبك بنجاح',
        },
    },
    PAYMENT_CONFIRMED: {
        en: {
            title: 'Payment Confirmed',
            body: 'Your payment has been confirmed',
        },
        ar: {
            title: 'تم تأكيد الدفع',
            body: 'تم تأكيد دفعتك',
        },
    },

    // Vendor notifications
    NEW_ORDER: {
        en: {
            title: 'New Order',
            body: 'You have received a new order',
        },
        ar: {
            title: 'طلب جديد',
            body: 'لديك طلب جديد',
        },
    },
    NEW_PAID_ORDER: {
        en: {
            title: 'New Paid Order',
            body: 'Payment confirmed for order',
        },
        ar: {
            title: 'طلب مدفوع جديد',
            body: 'تم تأكيد الدفع للطلب',
        },
    },

    // Admin notifications
    NEW_CUSTOM_ORDER: {
        en: {
            title: 'New Custom Order Request',
            body: 'A customer submitted a custom order',
        },
        ar: {
            title: 'طلب مخصص جديد',
            body: 'قدم عميل طلب مخصص',
        },
    },
    NEW_REGULAR_ORDER: {
        en: {
            title: 'New Order',
            body: 'A new order has been placed',
        },
        ar: {
            title: 'طلب جديد',
            body: 'تم تقديم طلب جديد',
        },
    },

    // Rider notifications
    NEW_PICKUP_REQUEST: {
        en: {
            title: 'New Pickup Request',
            body: 'You have a new pickup request',
        },
        ar: {
            title: 'طلب استلام جديد',
            body: 'لديك طلب استلام جديد',
        },
    },
    NEW_DELIVERY_REQUEST: {
        en: {
            title: 'New Delivery Request',
            body: 'You have a new delivery request',
        },
        ar: {
            title: 'طلب توصيل جديد',
            body: 'لديك طلب توصيل جديد',
        },
    },

    // Admin broadcast (custom message)
    ADMIN_BROADCAST: {
        en: {
            title: '', // Will be set dynamically
            body: '', // Will be set dynamically
        },
        ar: {
            title: '', // Will be set dynamically
            body: '', // Will be set dynamically
        },
    },
};

/**
 * Get notification content in the user's preferred language
 */
export function getNotificationContent(
    templateKey: keyof typeof NOTIFICATION_TEMPLATES,
    language: string = 'en',
    customData?: { title?: string; body?: string; customerName?: string; orderNumber?: string },
): { title: string; body: string } {
    const template = NOTIFICATION_TEMPLATES[templateKey];
    const lang = language === 'ar' ? 'ar' : 'en';

    let { title, body } = template[lang];

    // If custom data provided, use it (for admin broadcasts)
    if (customData?.title) title = customData.title;
    if (customData?.body) body = customData.body;

    // Replace placeholders if customData provided
    if (customData?.customerName) {
        body = body.replace('{customerName}', customData.customerName);
    }
    if (customData?.orderNumber) {
        body = body.replace('{orderNumber}', customData.orderNumber);
    }

    return { title, body };
}
