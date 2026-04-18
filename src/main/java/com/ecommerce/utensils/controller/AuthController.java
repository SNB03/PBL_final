package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.User;
import com.ecommerce.utensils.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ecommerce.utensils.service.EmailService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")

public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // Temporary storage for OTPs (In production, use Redis with an expiration timer!)
    private final Map<String, String> otpCache = new ConcurrentHashMap<>();
    @Autowired
    private EmailService emailService;
    private static class OtpDetails {
        String otpCode;
        LocalDateTime expiryTime;

        OtpDetails(String otpCode, LocalDateTime expiryTime) {
            this.otpCode = otpCode;
            this.expiryTime = expiryTime;
        }
    }

    // In-memory store for Guest OTPs
    private final Map<String, AuthController.OtpDetails> otpStorage = new HashMap<>();

   //  1. ENDPOINT TO GENERATE & "SEND" OTP
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already registered!"));
        }

        // Generate a 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpCache.put(email, otp);

        try {
            emailService.sendOtpEmail(email, otp);
            System.out.println("✅ Real OTP Email successfully sent to: " + email);
        } catch (Exception e) {
            System.err.println("❌ Failed to send email: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send email. Check SMTP settings."));
        }

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }
//    @PostMapping("/send-otp")
//    public ResponseEntity<?> verifyGuestOtp(@RequestParam String email, @RequestParam String otp) {
//        AuthController.OtpDetails storedOtpDetails = otpStorage.get(email);
//
//        if (storedOtpDetails == null) {
//            return ResponseEntity.badRequest().body(Map.of("error", "No OTP requested for this email."));
//        }
//
//        // 👉 NEW: Check if 10 minutes have passed
//        if (LocalDateTime.now().isAfter(storedOtpDetails.expiryTime)) {
//            otpStorage.remove(email); // Clean up expired OTP
//            return ResponseEntity.badRequest().body(Map.of("error", "OTP has expired. Please request a new one."));
//        }
//
//        // Check if OTP matches
//        if (storedOtpDetails.otpCode.equals(otp)) {
//            otpStorage.remove(email); // Clean up after success
//            return ResponseEntity.ok(Map.of("message", "Verified"));
//        }
//
//        return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP"));
//    }
    // 2. ENDPOINT TO VERIFY OTP & REGISTER USER
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> requestData) {
        String email = requestData.get("email");
        String otp = requestData.get("otp");

        // Verify OTP
        String storedOtp = otpCache.get(email);
        if (storedOtp == null || !storedOtp.equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP."));
        }

        // Create the user
        User newUser = new User();
        newUser.setName(requestData.get("name"));
        newUser.setEmail(email);

        newUser.setPhone(requestData.get("phone"));
        newUser.setPassword(requestData.get("password"));
        newUser.setRole("CUSTOMER");

        User savedUser = userRepository.save(newUser);
        savedUser.setPassword(null); // Hide password in response

        // Clear the OTP from cache
        otpCache.remove(email);

        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials) {
        String identifier = credentials.get("email"); // React still sends the key as 'email'
        String password = credentials.get("password");

        Optional<User> userOpt;

        // 👉 SMART ROUTING: Check if it's an email or a phone number
        if (identifier != null && identifier.contains("@")) {
            userOpt = userRepository.findByEmail(identifier);
        } else {
            userOpt = userRepository.findByPhone(identifier);
        }

        // Verify user exists and password matches
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User loggedInUser = userOpt.get();
            loggedInUser.setPassword(null); // Never return the password to the frontend!
            return ResponseEntity.ok(loggedInUser);
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email/phone or password."));
        }
    }
}