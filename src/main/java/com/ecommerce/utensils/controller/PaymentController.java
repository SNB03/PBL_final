package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.Order;
import com.ecommerce.utensils.repository.OrderRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")

public class PaymentController {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Autowired
    private OrderRepository orderRepository; // To update your MongoDB order status

    // 1. Create a Razorpay Order
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> data) throws RazorpayException {
        int amount = (int) data.get("amount"); // Amount must be in Paisa (Rupees * 100)

        RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount * 100);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

        com.razorpay.Order order = razorpay.orders.create(orderRequest);

        return ResponseEntity.ok(order.toString());
    }

    // 2. Verify the Payment Signature
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> data) {
        String razorpayOrderId = data.get("razorpay_order_id");
        String razorpayPaymentId = data.get("razorpay_payment_id");
        String razorpaySignature = data.get("razorpay_signature");
        String mongoDbOrderId = data.get("mongo_order_id"); // The ID of your actual DB order

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);

            // Verify the signature using your secret key
            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);

            if (isValid) {
                // Find the MongoDB order and mark it as PAID
                Order order = orderRepository.findById(mongoDbOrderId).orElseThrow();
                order.setStatus(com.ecommerce.utensils.model.OrderStatus.valueOf("PAID")); // Ensure you have PAID in your Enum
                orderRepository.save(order);

                return ResponseEntity.ok(Map.of("status", "Payment verified successfully"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment signature"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Verification failed"));
        }
    }
}