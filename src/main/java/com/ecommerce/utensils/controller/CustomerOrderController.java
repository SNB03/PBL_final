package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.Order;
import com.ecommerce.utensils.model.OrderStatus;
import com.ecommerce.utensils.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")

public class CustomerOrderController {

    @Autowired
    private OrderRepository orderRepository;

    @PostMapping
    public ResponseEntity<Order> placeOrder(@RequestBody Order newOrder) {
        // Force the status to PENDING so the admin sees it in the Active Orders tab
        if (newOrder.getStatus() == null) {
            newOrder.setStatus(OrderStatus.PENDING);
        }

        // Generate a 4-digit Delivery Verification PIN
        String generatedPin = String.format("%04d", new java.util.Random().nextInt(10000));
        newOrder.setVerificationPin(generatedPin);

        // 2. If all stock checks passed, save the Order
        newOrder.setStatus(com.ecommerce.utensils.model.OrderStatus.PENDING);
        Order savedOrder = orderRepository.save(newOrder);
        return ResponseEntity.ok(savedOrder);
    }
    // Fetch all orders for a specific customer
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getCustomerOrders(@PathVariable String customerId) {
        List<Order> orders = orderRepository.findByCustomerId(customerId);
        // Sort by newest first (optional, but good UX)
        orders.sort((o1, o2) -> o2.getOrderDate().compareTo(o1.getOrderDate()));
        return ResponseEntity.ok(orders);
    }

    // Fetch ALL orders (Delivery staff needs to see what's available)
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        orders.sort((o1, o2) -> o2.getOrderDate().compareTo(o1.getOrderDate()));
        return ResponseEntity.ok(orders);
    }

    // Update Order Status & Assign Delivery Person
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> payload) {

        return orderRepository.findById(orderId).map(order -> {
            // Update the status
            if (payload.containsKey("status")) {
                order.setStatus(com.ecommerce.utensils.model.OrderStatus.valueOf(payload.get("status")));
            }
            // Assign to the delivery driver
            if (payload.containsKey("assignedTo")) {
                order.setAssignedTo(payload.get("assignedTo"));
            }

            Order updatedOrder = orderRepository.save(order);
            return ResponseEntity.ok(updatedOrder);
        }).orElse(ResponseEntity.notFound().build());
    }
    // 👉 NEW: DELETE method for removing past history
    @DeleteMapping("/{orderId}")
    public ResponseEntity<?> deleteOrder(@PathVariable String orderId) {
        return orderRepository.findById(orderId).map(order -> {
            orderRepository.delete(order);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
    // 👉 NEW: PATCH method for quickly Cancelling an order via URL params
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<?> patchOrderStatus(
            @PathVariable String orderId,
            @RequestParam String status) {
        return orderRepository.findById(orderId).map(order -> {
            order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }
    // Verify Delivery PIN
    @PostMapping("/{orderId}/verify-delivery")
    public ResponseEntity<?> verifyDelivery(@PathVariable String orderId, @RequestBody Map<String, String> payload) {
        String enteredPin = payload.get("pin");

        return orderRepository.findById(orderId).map(order -> {
            if (order.getVerificationPin() != null && order.getVerificationPin().equals(enteredPin)) {
                order.setStatus(com.ecommerce.utensils.model.OrderStatus.DELIVERED);
                Order updatedOrder = orderRepository.save(order);
                return ResponseEntity.ok(updatedOrder);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Delivery PIN."));
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}