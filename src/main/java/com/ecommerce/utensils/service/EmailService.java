package com.ecommerce.utensils.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${BREVO_API_KEY}")
    private String brevoApiKey;

    @Value("${app.mail.from-address}")
    private String verifiedSenderEmail;

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://api.brevo.com/v3/smtp/email";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            Map<String, String> sender = new HashMap<>();
            sender.put("name", "UtensilPro");
            sender.put("email", verifiedSenderEmail);

            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", toEmail);

            Map<String, Object> body = new HashMap<>();
            body.put("sender", sender);
            body.put("to", List.of(recipient));
            body.put("subject", "Your UtensilPro Verification Code");

            String htmlContent = "<h2>Welcome to UtensilPro!</h2>" +
                    "<p>Your 6-digit verification code is: <strong style='font-size:20px; color:#d35400;'>" + otp + "</strong></p>" +
                    "<p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>" +
                    "<p>Best Regards,<br>The UtensilPro Team</p>";
            body.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);

            System.out.println("✅ Brevo API OTP successfully sent to: " + toEmail);

        } catch (Exception e) {
            System.err.println("❌ Failed to send Brevo OTP email: " + e.getMessage());
            System.out.println("👉 [DEBUG FALLBACK] OTP IS: " + otp);
        }
    }
}