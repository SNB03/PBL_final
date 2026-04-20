package com.ecommerce.utensils.service;

import com.ecommerce.utensils.dto.ContactRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ContactService {

    @Value("${BREVO_API_KEY}")
    private String brevoApiKey;

    @Value("${app.mail.from-address}")
    private String verifiedSenderEmail;

    @Value("${app.mail.admin-address}")
    private String adminInbox;

    public void sendContactEmail(ContactRequest request) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://api.brevo.com/v3/smtp/email";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            // Sender is your verified app email
            Map<String, String> sender = new HashMap<>();
            sender.put("name", "UtensilPro App");
            sender.put("email", verifiedSenderEmail);

            // Recipient is YOU (the admin)
            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", adminInbox);

            // ReplyTo is the CUSTOMER
            Map<String, String> replyTo = new HashMap<>();
            replyTo.put("email", request.getEmail());
            replyTo.put("name", request.getName());

            Map<String, Object> body = new HashMap<>();
            body.put("sender", sender);
            body.put("to", List.of(recipient));
            body.put("replyTo", replyTo);
            body.put("subject", "New Customer Inquiry from: " + request.getName());

            String htmlContent = "<h3>You have received a new message from the UtensilPro Contact Form.</h3>" +
                    "<p><strong>Customer Name:</strong> " + request.getName() + "</p>" +
                    "<p><strong>Customer Email:</strong> " + request.getEmail() + "</p>" +
                    "<p><strong>Message:</strong><br/>" + request.getMessage().replace("\n", "<br/>") + "</p>";
            body.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, httpEntity, String.class);

            System.out.println("✅ Brevo API Contact Email sent to Admin.");

        } catch (Exception e) {
            System.err.println("❌ Failed to send Contact Form email via Brevo: " + e.getMessage());
            throw new RuntimeException("Could not send contact email. Please try again later.");
        }
    }
}