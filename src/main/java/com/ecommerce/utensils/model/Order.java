package com.ecommerce.utensils.model;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "orders")
public class Order {
    @Id
    private String id;

    @NotBlank
    private String customerName;
    private String type;

    @NotNull
    private OrderStatus status = OrderStatus.PENDING; // Using Enum!

    @NotNull
    private BigDecimal total;

    private LocalDateTime orderDate = LocalDateTime.now(); // Auto timestamp

    private String assignedTo;
    private String customerId;
    private String verificationPin;

    // 👉 ADD THESE 4 MISSING FIELDS SO MONGODB SAVES THEM
    private String phone;
    private String address;
    private String paymentMethod;
    private BigDecimal deliveryFee;

    // 👉 THE FIX: Add this line so Spring Boot saves the GST!
    private BigDecimal taxAmount;
    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItem> itemsList;

    @Data
    public static class OrderItem {
        private String productId;
        private String name;
        private int qty;
        private BigDecimal price;
        private String category;    // Added for Master Picking List sorting
        private String subcategory;
    }
}