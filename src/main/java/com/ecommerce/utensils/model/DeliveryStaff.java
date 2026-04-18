package com.ecommerce.utensils.model;


import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "delivery_staff")
public class DeliveryStaff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // We will format the ID like "D-01" in the frontend, but store it as a clean integer in SQL
    private String name;
    private String phone;
    private boolean isActive = true;
    private String pin;
    private String alternatePhone;
    private String role;
}