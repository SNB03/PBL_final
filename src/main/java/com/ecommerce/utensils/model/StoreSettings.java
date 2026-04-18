package com.ecommerce.utensils.model;


import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "store_settings")
public class StoreSettings {
    @Id
    private Long id = 1L; // We only ever need ONE row of settings

    private int maxRadius;
    private BigDecimal ratePerKm;
    private BigDecimal freeDeliveryThreshold;
}