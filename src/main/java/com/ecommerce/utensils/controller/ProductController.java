package com.ecommerce.utensils.controller;

import com.ecommerce.utensils.model.Product;
import com.ecommerce.utensils.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j // Adds low-priority logging!
@RestController
@RequestMapping("/api/products")

public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    // MEDIUM PRIORITY: Pagination Added
    // URL Example: /api/products?page=0&size=20
    @GetMapping
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }


    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        Product product = productRepository.findById(id)
                .orElse(new Product());

        return ResponseEntity.ok(product);
    }
    // HIGH PRIORITY: Validation added via @Valid
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        log.info("Creating new product: {}", product.getName());
        return ResponseEntity.ok(productRepository.save(product));
    }

    // MEDIUM PRIORITY: Delete API
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productRepository.deleteById(id);
        log.info("Deleted product ID: {}", id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Product> updateStock(@PathVariable String id, @RequestParam int stock) {
        if (stock < 0) return ResponseEntity.badRequest().build();

        return productRepository.findById(id).map(product -> {
            product.setStock(stock);
            return ResponseEntity.ok(productRepository.save(product));
        }).orElse(ResponseEntity.notFound().build());
    }



    @PostMapping("/bulk-upload")
    public ResponseEntity<?> bulkUploadCSV(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty.");

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(fileReader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            List<Product> products = new ArrayList<>();
            Map<String, Integer> headerMap = csvParser.getHeaderMap(); // Get whatever headers the user actually uploaded

            for (CSVRecord record : csvParser) {
                Product p = new Product();
                Map<String, String> dynamicAttrs = new HashMap<>();

                // Loop through every column in the current row
                for (String header : headerMap.keySet()) {
                    String value = record.get(header);

                    // Skip empty cells
                    if (value == null || value.trim().isEmpty()) continue;

                    // Match the header (ignoring case) to our Java fields
                    switch (header.toLowerCase()) {
                        case "name":
                            p.setName(value);
                            break;
                        case "category":
                            p.setCategory(value);
                            break;
                        case "subcategory":
                            p.setSubcategory(value);
                            break;
                        case "price":
                            p.setPrice(new BigDecimal(value));
                            break;
                        case "stock":
                            p.setStock(Integer.parseInt(value));
                            break;
                        case "img":
                            p.setImg(value);
                            break;
                        case "shortDesc":
                            p.setShortDesc(value);
                            break;
                        case "longDesc":
                            p.setLongDesc(value);
                            break;
                        case "originalprice":
                        case "originalpri":
                            p.setOriginalPrice(new BigDecimal(value));
                              break;
                        default:
                            // THE MAGIC: If it's a column Java doesn't recognize (like 'lidtype' or 'material'),
                            // automatically save it as a dynamic attribute in MongoDB!
                            dynamicAttrs.put(header, value);
                            break;
                    }
                }

                // Failsafe: If your CSV didn't have a dedicated Name column, fall back to Company Name or Description
                if (p.getName() == null) {
                    p.setName(record.isMapped("company name") ? record.get("company name") : "Unnamed Product");
                }

                // Set the dynamic attributes we collected
                p.setAttrs(dynamicAttrs);
                products.add(p);
            }

            productRepository.saveAll(products);
            log.info("Bulk uploaded {} products with dynamic attributes", products.size());
            return ResponseEntity.ok(Map.of("message", "Success", "count", products.size()));

        } catch (Exception e) {
            log.error("CSV Upload failed", e);
            return ResponseEntity.internalServerError().body("Error parsing CSV: " + e.getMessage());
        }
    }

    // --- FULL PRODUCT UPDATE (EDIT FEATURE) ---
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @RequestBody Product productDetails) {
        return productRepository.findById(id).map(existingProduct -> {
            existingProduct.setName(productDetails.getName());
            existingProduct.setCategory(productDetails.getCategory());
            existingProduct.setSubcategory(productDetails.getSubcategory());
            existingProduct.setPrice(productDetails.getPrice());
            existingProduct.setOriginalPrice(productDetails.getOriginalPrice());
            existingProduct.setStock(productDetails.getStock());
            existingProduct.setImg(productDetails.getImg());
            existingProduct.setShortDesc(productDetails.getShortDesc());
            existingProduct.setLongDesc(productDetails.getLongDesc());
            existingProduct.setAttrs(productDetails.getAttrs()); // Saves the edited dynamic attributes!

            return ResponseEntity.ok(productRepository.save(existingProduct));
        }).orElse(ResponseEntity.notFound().build());
    }
}