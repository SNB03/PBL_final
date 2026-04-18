package com.ecommerce.utensils.service;

import com.ecommerce.utensils.dto.ContactRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.Data;

@Service
public class ContactService {

    @Autowired
    private JavaMailSender mailSender;

    // This pulls your email from application.properties so you don't hardcode it!
    @Value("${spring.mail.username}")
    private String adminEmail;

    public void sendContactEmail(ContactRequest request) {
        SimpleMailMessage message = new SimpleMailMessage();

        // Send it to your store's admin email
        message.setTo(adminEmail);

        // Make the subject clear so it doesn't get lost in your inbox
        message.setSubject("New Customer Inquiry from: " + request.getName());

        // Build the email body
        String emailBody = "You have received a new message from the UtensilPro Contact Form.\n\n" +
                "Customer Name: " + request.getName() + "\n" +
                "Customer Email: " + request.getEmail() + "\n\n" +
                "Message:\n" + request.getMessage();

        message.setText(emailBody);

        // We set the "reply-to" so if you hit 'Reply' in Gmail, it goes straight to the customer!
        message.setReplyTo(request.getEmail());

        mailSender.send(message);
    }
}