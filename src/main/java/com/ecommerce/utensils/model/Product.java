package com.ecommerce.utensils.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Document(collection = "products")
public class Product {

    @Id
    private String id;

    @NotBlank(message = "Product name cannot be empty")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    private String subcategory;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
    private BigDecimal price;





    @Min(value = 0, message = "Stock cannot be negative")
    private int stock;

    private String img;
    private String shortDesc;

    private String longDesc;

    private BigDecimal originalPrice;

    private Map<String, String> attrs;
}