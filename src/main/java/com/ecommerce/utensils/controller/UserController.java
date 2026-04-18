package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.User;
import com.ecommerce.utensils.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")

public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody User updateRequest) {
        return userRepository.findById(id).map(existingUser -> {

            // Update only the allowed fields
            existingUser.setName(updateRequest.getName());
            existingUser.setPhone(updateRequest.getPhone());
            existingUser.setAddress(updateRequest.getAddress());

            // Save to database
            User savedUser = userRepository.save(existingUser);
            savedUser.setPassword(null); // Never send the password back!

            return ResponseEntity.ok(savedUser);

        }).orElse(ResponseEntity.notFound().build());
    }
}