// src/main/java/com/ecommerce/utensils/controller/HomeController.java
package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.Product;
import com.ecommerce.utensils.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/storefront")

public class HomeController {

    private final String PYTHON_AI_URL = "http://localhost:8000/api/ai/home-recommend";
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/dynamic-home/{userId}")
    public ResponseEntity<Map<String, Object>> getDynamicHomeProducts(
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "") String recentSearches) {

        List<String> pastPurchases = new ArrayList<>();
        if (!userId.equals("guest")) {
            // Replace with: orderRepository.findProductIdsByUserId(userId);
            pastPurchases.add("1");
        }

        List<Product> dbProducts = productRepository.findAll();

        List<Map<String, Object>> catalogPayload = dbProducts.stream()
                .filter(p -> p.getStock() > 0)
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getId().toString());
                    map.put("name", p.getName());
                    map.put("category", p.getCategory());
                    map.put("season", inferSeason(p.getCategory()));
                    map.put("price", p.getPrice());
                    map.put("image", p.getImg() != null ? p.getImg() : "📦");

                    // 👉 NEW: Feed the precise popularity score to Python!
                    map.put("popularity", calculatePopularity(p));

                    return map;
                }).collect(Collectors.toList());

        List<String> searchesList = recentSearches.isEmpty() ? List.of() : Arrays.asList(recentSearches.split(","));

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("user_id", userId);
        aiRequest.put("past_purchases", pastPurchases);
        aiRequest.put("recent_searches", searchesList);
        aiRequest.put("current_month", LocalDate.now().getMonthValue());
        aiRequest.put("catalog", catalogPayload);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(PYTHON_AI_URL, aiRequest, Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            System.err.println("AI Engine Offline. Serving default catalog.");
            return ResponseEntity.ok(getFallbackProducts(dbProducts));
        }
    }

    // --- HELPER METHODS ---

    /**
     * Calculates a popularity score between 0.0 and 1.0.
     * If you have a 'salesCount' in your DB, use that.
     * Otherwise, we simulate it based on stock depletion.
     */
    private double calculatePopularity(Product p) {
        // Example: If base stock is usually 100, and current stock is 10, it's highly popular (0.9)
        // Adjust this logic based on your actual Database columns!
        int currentStock = p.getStock();
        int maxStock = 100; // Assume a standard restock level

        if (currentStock >= maxStock) return 0.1; // Not selling

        double score = 1.0 - ((double) currentStock / maxStock);

        // Ensure it stays neatly between 0.1 and 1.0
        return Math.max(0.1, Math.min(score, 1.0));
    }

    private String inferSeason(String category) {
        if (category == null) return "All";
        String catLower = category.toLowerCase();
        if (catLower.contains("serveware") || catLower.contains("jug")) return "Summer";
        if (catLower.contains("flask") || catLower.contains("thermos")) return "Winter";
        if (catLower.contains("dining") || catLower.contains("gift")) return "Festive";
        return "All";
    }

    private Map<String, Object> getFallbackProducts(List<Product> dbProducts) {
        List<Map<String, Object>> fallbackItems = dbProducts.stream().limit(4).map(p -> Map.<String,Object>of(
                "id", p.getId().toString(), "name", p.getName(), "category", p.getCategory(),
                "price", p.getPrice(), "img", p.getImg() != null ? p.getImg() : "📦", "tagline", "Store Bestseller"
        )).collect(Collectors.toList());

        return Map.of(
                "personalized", fallbackItems,
                "trending_by_category", fallbackItems
        );
    }
}