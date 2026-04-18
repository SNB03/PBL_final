package com.ecommerce.utensils.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String adminEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(adminEmail); // Must match the username in application.properties
        message.setTo(toEmail);
        message.setSubject("Your UtensilPro Verification Code");

        String emailBody = "Welcome to UtensilPro!\n\n" +
                "Your 6-digit verification code is: " + otp + "\n\n" +
                "This code will expire shortly. Please do not share this code with anyone.\n\n" +
                "Best Regards,\n" +
                "The UtensilPro Team";

        message.setText(emailBody);

        // This triggers the actual email dispatch
        mailSender.send(message);
    }
}