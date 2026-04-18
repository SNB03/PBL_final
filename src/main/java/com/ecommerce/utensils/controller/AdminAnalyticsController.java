// src/main/java/com/ecommerce/utensils/controller/AdminAnalyticsController.java
package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")

public class AdminAnalyticsController {

    @Autowired
    private RecommendationService recommendationService;

    @GetMapping("/ai-insights")
    public ResponseEntity<Map<String, Object>> getAiInsights() {
        Map<String, Object> insights = recommendationService.getStoreWideInsights();

        if (insights == null) {
            // Python server is down, return 503 Service Unavailable
            return ResponseEntity.status(503).body(Map.of("error", "AI Engine is currently offline."));
        }

        return ResponseEntity.ok(insights);
    }
}