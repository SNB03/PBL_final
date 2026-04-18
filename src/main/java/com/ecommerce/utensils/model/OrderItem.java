package com.ecommerce.utensils.model;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderItem {
    private String productId;
    private String name;
    private int qty;
    private BigDecimal price;
}