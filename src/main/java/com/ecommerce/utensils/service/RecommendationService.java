// src/main/java/com/ecommerce/utensils/service/RecommendationService.java
package com.ecommerce.utensils.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class RecommendationService {
    @Value("${python.url}")
    private String pythonUrl;
    // URL of your Python FastAPI FSDP Engine
    private final String PYTHON_AI_URL = "pythonUrl/api/ai/recommend";
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Fetches Store-Wide FSDP Insights for the Admin Dashboard
     */
    public Map<String, Object> getStoreWideInsights() {
        try {
            // 1. Prepare data for the Python Model.
            // For the Admin view, we send a "Global" user and a sample trending item
            // to get the baseline seasonal FSDP recommendations.
            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("user_id", "STORE_GLOBAL");
            requestPayload.put("past_purchases", List.of("PROD-005")); // Replace with actual trending top-seller ID
            requestPayload.put("current_month", LocalDate.now().getMonthValue());

            // 2. Call the Python AI Model
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    PYTHON_AI_URL,
                    requestPayload,
                    Map.class
            );

            // 3. Extract the response to match the React frontend's expected format
            Map<String, Object> aiData = response.getBody();

            // Format the response specifically for the Admin Dashboard UI
            if (aiData != null && aiData.containsKey("recommendations")) {
                List<Map<String, Object>> recs = (List<Map<String, Object>>) aiData.get("recommendations");

                // Extract top product ID and reasoning
                String primaryReasoning = recs.isEmpty() ? "Standard seasonal trends apply." : (String) recs.get(0).get("reasoning");
                List<String> recommendedIds = recs.stream().map(r -> (String) r.get("product_id")).toList();

                return Map.of(
                        "ai_confidence", aiData.get("overall_confidence"),
                        "fsdp_reasoning", primaryReasoning,
                        "recommended_product_ids", recommendedIds
                );
            }

            return getFallbackResponse();

        } catch (RestClientException e) {
            System.err.println("CRITICAL: Python AI Engine is offline or unreachable.");
            return null; // Returning null triggers the "AI Engine Offline" UI in React
        }
    }

    private Map<String, Object> getFallbackResponse() {
        return Map.of(
                "ai_confidence", 0.50,
                "fsdp_reasoning", "Standard seasonal baseline. FSDP Engine returned non-standard data.",
                "recommended_product_ids", List.of("PROD-001")
        );
    }
}