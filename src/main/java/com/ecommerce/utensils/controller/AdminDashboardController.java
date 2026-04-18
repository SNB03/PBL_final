package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.Order;
import com.ecommerce.utensils.model.OrderStatus;
import com.ecommerce.utensils.repository.OrderRepository;
import com.ecommerce.utensils.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")

public class AdminDashboardController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/live-overview")
    public Map<String, Object> getLiveOverviewMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // 1. Calculate Today's Revenue (Safely using BigDecimal & LocalDateTime)
        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN); // 00:00
        LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);   // 23:59

        List<Order> todaysCompletedOrders = orderRepository.findByOrderDateBetweenAndStatus(
                startOfDay, endOfDay, OrderStatus.DELIVERED);

        // Summing BigDecimals properly using a Stream reduction
        BigDecimal todayRevenue = todaysCompletedOrders.stream()
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Count Pending Orders to Pack (Using DB Count, much faster!)
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);

        // 3. Count Action Required (Alerts: Out of stock + Low stock <= 5)
        long lowStockCount = productRepository.countByStockLessThanEqual(5);
        long totalAlerts = pendingOrders + lowStockCount;

        // Package it up for React
        metrics.put("revenueToday", todayRevenue);
        metrics.put("ordersToPack", pendingOrders);
        metrics.put("actionRequired", totalAlerts);

        return metrics;
    }
}