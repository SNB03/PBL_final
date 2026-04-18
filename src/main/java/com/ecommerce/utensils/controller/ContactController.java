package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.dto.ContactRequest;
import com.ecommerce.utensils.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/contact")

public class ContactController {

    @Autowired
    private ContactService contactService;

    @Autowired
    private JavaMailSender mailSender;

    // Helper class to store OTP and Expiration Time
    private static class OtpDetails {
        String otpCode;
        LocalDateTime expiryTime;

        OtpDetails(String otpCode, LocalDateTime expiryTime) {
            this.otpCode = otpCode;
            this.expiryTime = expiryTime;
        }
    }

    // In-memory store for Guest OTPs
    private final Map<String, OtpDetails> otpStorage = new HashMap<>();

    // 1. GUEST FLOW: Send OTP (Valid for 10 mins)
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendGuestOtp(@RequestParam String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));

        // 👉 NEW: Save OTP with a 10-minute expiration
        otpStorage.put(email, new OtpDetails(otp, LocalDateTime.now().plusMinutes(10)));

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("UtensilPro - Contact Form Verification");
            message.setText("Your verification code is: " + otp + "\n\nThis code will expire in 10 minutes. Please enter this code to submit your message.");
            mailSender.send(message);

            return ResponseEntity.ok(Map.of("message", "OTP sent"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to send OTP"));
        }
    }

    // 2. GUEST FLOW: Verify OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyGuestOtp(@RequestParam String email, @RequestParam String otp) {
        OtpDetails storedOtpDetails = otpStorage.get(email);

        if (storedOtpDetails == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No OTP requested for this email."));
        }

        // 👉 NEW: Check if 10 minutes have passed
        if (LocalDateTime.now().isAfter(storedOtpDetails.expiryTime)) {
            otpStorage.remove(email); // Clean up expired OTP
            return ResponseEntity.badRequest().body(Map.of("error", "OTP has expired. Please request a new one."));
        }

        // Check if OTP matches
        if (storedOtpDetails.otpCode.equals(otp)) {
            otpStorage.remove(email); // Clean up after success
            return ResponseEntity.ok(Map.of("message", "Verified"));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP"));
    }

    // 3. FINAL STEP: Submit the actual message
    @PostMapping
    public ResponseEntity<?> submitContactForm(@Valid @RequestBody ContactRequest request) {
        try {
            contactService.sendContactEmail(request);
            return ResponseEntity.ok(Map.of("message", "Email sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to send email."));
        }
    }
}