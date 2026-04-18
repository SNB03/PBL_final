package com.ecommerce.utensils.model;

public enum OrderStatus {
    PENDING,
    PACKED,
    PROCESSING, // Needed for UPI Admin verification
    PAID,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}