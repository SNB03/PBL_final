package com.ecommerce.utensils.repository;

import com.ecommerce.utensils.model.Order;
import com.ecommerce.utensils.model.OrderStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {

    // Use Enum instead of String, and use Count instead of fetching whole lists
    long countByStatus(OrderStatus status);
    List<Order> findByCustomerId(String customerId);
    // Find orders within a specific time range (e.g., today from 00:00 to 23:59)
    List<Order> findByOrderDateBetweenAndStatus(LocalDateTime start, LocalDateTime end, OrderStatus status);
}