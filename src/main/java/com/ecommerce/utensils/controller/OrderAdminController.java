package com.ecommerce.utensils.controller;


import com.ecommerce.utensils.model.Order;
import com.ecommerce.utensils.model.OrderStatus;
import com.ecommerce.utensils.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/orders")

public class OrderAdminController {

    @Autowired
    private OrderRepository orderRepository;

    // 1. Fetch all Active Orders (Everything except 'Completed')
    @GetMapping("/active")
    public List<Order> getActiveOrders() {
        return orderRepository.findAll().stream()
                .filter(order -> !"Completed".equals(order.getStatus()))
                .collect(Collectors.toList());
    }

    // 2. Simple Status Update (e.g., Pending -> Packed)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable String id, @RequestParam String status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(OrderStatus.valueOf(status));
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 3. Assign Delivery Partner
    @PatchMapping("/{id}/assign")
    public ResponseEntity<Order> assignDelivery(@PathVariable String id, @RequestParam String boyId, @RequestParam String boyName) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(OrderStatus.valueOf("OUT_FOR_DELIVERY"));
            // Assuming you add 'assignedTo' as a String in your Order.java model
            order.setAssignedTo(boyId + " - " + boyName);
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 4. Verify Store Pickup PIN
    // HIGH PRIORITY: Null safety in order verification
    @PostMapping("/{id}/verify")
    public ResponseEntity<String> verifyOrder(@PathVariable String id, @RequestParam(required = false) String pin) {
        // 1. Check if PIN was even provided
        if (pin == null || pin.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("PIN is required for verification.");
        }

        // 2. Safely get the order
        return orderRepository.findById(id).map(order -> {

            // 3. Null-safe string comparison
            if (pin.equals(order.getVerificationPin())) {
                order.setStatus(OrderStatus.DELIVERED); // Using the new Enum!
                orderRepository.save(order);
                return ResponseEntity.ok("Verified");
            } else {
                return ResponseEntity.badRequest().body("Invalid PIN");
            }

        }).orElse(ResponseEntity.notFound().build());
    }

    // --- GET PAST ORDERS ---
    @GetMapping("/past")
    public List<Order> getPastOrders() {
        return orderRepository.findAll().stream()
                .filter(order -> "COMPLETED".equals(order.getStatus().name()))
                .collect(Collectors.toList());
    }
}