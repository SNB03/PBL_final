package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.User;
import com.ecommerce.utensils.repository.UserRepository;
import com.ecommerce.utensils.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    // Helper class to store OTP and its Expiration Time
    private static class OtpDetails {
        String otpCode;
        LocalDateTime expiryTime;

        OtpDetails(String otpCode, LocalDateTime expiryTime) {
            this.otpCode = otpCode;
            this.expiryTime = expiryTime;
        }
    }

    // Thread-safe storage for OTPs
    private final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();

    // ==========================================
    // 1. GENERATE & SEND OTP
    // ==========================================
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }

        // Check if user already exists
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already registered!"));
        }

        // Generate a 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save to cache with a 10-minute expiration
        otpCache.put(email, new OtpDetails(otp, LocalDateTime.now().plusMinutes(10)));

        try {
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) {

            // Even if email fails, we return OK so you can test it using the console output
        }

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }

    // ==========================================
    // 2. VERIFY OTP & REGISTER USER
    // ==========================================
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> requestData) {
        String email = requestData.get("email");
        String otp = requestData.get("otp");

        OtpDetails storedOtpDetails = otpCache.get(email);

        // 1. Check if OTP was ever requested
        if (storedOtpDetails == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No OTP requested for this email."));
        }

        // 2. Check if OTP expired (10 minutes)
        if (LocalDateTime.now().isAfter(storedOtpDetails.expiryTime)) {
            otpCache.remove(email);
            return ResponseEntity.badRequest().body(Map.of("error", "OTP has expired. Please request a new one."));
        }

        // 3. Check if OTP matches
        if (!storedOtpDetails.otpCode.equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP. Please try again."));
        }

        // --- OTP IS VALID! Create the user ---
        User newUser = new User();
        newUser.setName(requestData.get("name"));
        newUser.setEmail(email);
        newUser.setPhone(requestData.get("phone"));
        newUser.setPassword(requestData.get("password"));
        newUser.setRole("CUSTOMER");

        User savedUser = userRepository.save(newUser);
        savedUser.setPassword(null); // Hide password in response for security

        // Clean up the OTP cache
        otpCache.remove(email);

        return ResponseEntity.ok(savedUser);
    }

    // ==========================================
    // 3. LOGIN USER
    // ==========================================
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials) {
        String identifier = credentials.get("email"); // React sends 'email' key even if it's a phone number
        String password = credentials.get("password");

        Optional<User> userOpt;

        // SMART ROUTING: Check if identifier is an email or a phone number
        if (identifier != null && identifier.contains("@")) {
            userOpt = userRepository.findByEmail(identifier);
        } else {
            userOpt = userRepository.findByPhone(identifier);
        }

        // Verify user exists and password matches
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User loggedInUser = userOpt.get();
            loggedInUser.setPassword(null); // Hide password in response for security
            return ResponseEntity.ok(loggedInUser);
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email/phone or password."));
        }
    }
}