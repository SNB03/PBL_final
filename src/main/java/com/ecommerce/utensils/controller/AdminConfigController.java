package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.DeliveryStaff;
import com.ecommerce.utensils.model.StoreSettings;
import com.ecommerce.utensils.repository.DeliveryStaffRepository;
import com.ecommerce.utensils.repository.StoreSettingsRepository;
import com.ecommerce.utensils.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.ecommerce.utensils.model.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/admin/config")

public class AdminConfigController {

    @Autowired
    private DeliveryStaffRepository staffRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreSettingsRepository settingsRepository;

    // --- STAFF APIs ---
    @GetMapping("/staff")
    public List<DeliveryStaff> getAllStaff() {
        return staffRepository.findAll();
    }

    @PostMapping("/staff")
    public ResponseEntity<?> addStaff(@RequestBody DeliveryStaff staff) {

        // 1. Auto-generate a secure 6-digit PIN
        String generatedPin = String.format("%06d", new Random().nextInt(999999));

        staff.setPin(generatedPin);
        staff.setActive(true); // Default to active when hired

        DeliveryStaff savedStaff = staffRepository.save(staff);

        // 2. CRITICAL: Create a User profile so they can actually log in via your /login page!
        // We use their phone number as their email/ID, and the PIN as their password.
        try {
            User riderUser = new User();
            riderUser.setName(staff.getName());
            riderUser.setPhone(staff.getPhone());
            riderUser.setEmail(staff.getPhone() + "@utensilpro.delivery"); // Dummy email for login consistency
            riderUser.setPassword(generatedPin);
            riderUser.setRole("DELIVERY");
            userRepository.save(riderUser);
        } catch (Exception e) {
            System.err.println("Warning: Could not sync staff to User table. Phone number might already exist.");
        }

        return ResponseEntity.ok(savedStaff);
    }
    // --- SETTINGS APIs ---
    @GetMapping("/settings")
    public ResponseEntity<StoreSettings> getSettings() {
        return settingsRepository.findById(1L)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/settings")
    public StoreSettings saveSettings(@RequestBody StoreSettings settings) {
        settings.setId(1L); // Force it to always update row 1
        return settingsRepository.save(settings);
    }
    // 👉 NEW: Delete Staff Endpoint
    @DeleteMapping("/staff/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id) {
        return staffRepository.findById(id).map(staff -> {
            staffRepository.delete(staff);
            // Optional: You may also want to delete their User login profile here
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}