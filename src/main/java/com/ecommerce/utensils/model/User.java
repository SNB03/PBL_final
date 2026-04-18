package com.ecommerce.utensils.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users") // SQL Table
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // In production, this would be hashed with BCrypt!

    private String phone;

    @Column(nullable = false)
    private String role = "CUSTOMER"; // Default role. The admin will have "ADMIN".


}