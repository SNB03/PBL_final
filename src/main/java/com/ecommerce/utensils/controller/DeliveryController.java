package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.StoreSettings;
import com.ecommerce.utensils.repository.StoreSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery")

public class DeliveryController {

    @Autowired
    private StoreSettingsRepository settingsRepository;

    // Origin Coordinates (e.g., UtensilPro Store location in Pune)
    private static final double STORE_LAT = 18.4896;
    private static final double STORE_LNG = 73.8646;

    @GetMapping("/estimate")
    public ResponseEntity<?> estimateDelivery(@RequestParam String address, @RequestParam double cartTotal) {
        try {
            // 1. Fetch Admin Settings dynamically from MySQL using your exact 1L mapping
            StoreSettings settings = settingsRepository.findById(1L).orElse(null);

            // Set our safety fallbacks in case the MySQL table is completely empty
            double maxRadius = 55.0;
            double ratePerKm = 10.0;
            double freeThreshold = 999.0;

            // If the admin has saved settings in MySQL, use their exact values!
            if (settings != null) {
                if (settings.getMaxRadius() > 0) {
                    maxRadius = settings.getMaxRadius(); // int type
                }
                if (settings.getRatePerKm() != null) {
                    ratePerKm = settings.getRatePerKm().doubleValue(); // BigDecimal type
                }
                if (settings.getFreeDeliveryThreshold() != null) {
                    freeThreshold = settings.getFreeDeliveryThreshold().doubleValue(); // BigDecimal type
                }
            }

            RestTemplate restTemplate = new RestTemplate();

            // 👉 CRITICAL: OpenStreetMap will block us without this Header!
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "UtensilPro-ECommerce/1.0 (student-project)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            // ==========================================
            // STEP 1: GEOCODE (Address -> Coordinates)
            // ==========================================
            String geocodeUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + address;
            ResponseEntity<List> geoResponse = restTemplate.exchange(geocodeUrl, HttpMethod.GET, entity, List.class);
            List<Map<String, Object>> geoResults = geoResponse.getBody();

            if (geoResults == null || geoResults.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not find this exact address. Try adding your city or pincode."));
            }

            double userLat = Double.parseDouble(geoResults.get(0).get("lat").toString());
            double userLng = Double.parseDouble(geoResults.get(0).get("lon").toString());

            // ==========================================
            // STEP 2: ROUTING (Calculate Actual Driving Distance)
            // ==========================================
            String routeUrl = String.format("http://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=false",
                    STORE_LNG, STORE_LAT, userLng, userLat);

            ResponseEntity<Map> routeResponse = restTemplate.exchange(routeUrl, HttpMethod.GET, entity, Map.class);
            List<Map<String, Object>> routes = (List<Map<String, Object>>) routeResponse.getBody().get("routes");

            if (routes == null || routes.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not calculate a driving route to this location."));
            }

            // OSRM returns distance in METERS. Convert to KM.
            double distanceInMeters = ((Number) routes.get(0).get("distance")).doubleValue();
            double distanceInKm = distanceInMeters / 1000.0;

            // ==========================================
            // STEP 3: APPLY ADMIN BUSINESS LOGIC
            // ==========================================
            boolean deliverable = distanceInKm <= maxRadius;
            double fee = 0;

            // If it is deliverable AND the cart total is less than the free threshold, calculate the fee!
            if (deliverable && cartTotal < freeThreshold) {
                fee = Math.round(distanceInKm * ratePerKm);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("distance", Math.round(distanceInKm * 10.0) / 10.0); // Round to 1 decimal
            result.put("deliverable", deliverable);
            result.put("fee", fee);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            // Prints the exact error to your backend console so you can debug instantly
            System.err.println("DELIVERY API ERROR: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Server error calculating distance. Please check your backend logs."));
        }
    }
}