//package com.ecommerce.utensils.service;
//
//import com.ecommerce.utensils.model.Product;
//import com.ecommerce.utensils.repository.ProductRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//import java.util.Optional;
//
//@Service
//public class ProductService {
//
//    @Autowired
//    private ProductRepository productRepository;
//
//    // 1. GET ALL: Fetch all products
//    public List<Product> getAllProducts() {
//        return productRepository.findAll();
//    }
//
//    // 2. GET ONE: Fetch a single product by its ID
//    public Optional<Product> getProductById(String id) {
//        return productRepository.findById(id);
//    }
//
//    // 3. ADD: Save a new product
//    public Product addProduct(Product product) {
//        return productRepository.save(product);
//    }
//
//    // 4. UPDATE: Find an existing product and change its details
//    public Product updateProduct(String id, Product productDetails) {
//        return productRepository.findById(id).map(existingProduct -> {
//            existingProduct.setName(productDetails.getName());
//            existingProduct.setCategory(productDetails.getCategory());
//            existingProduct.setMaterial(productDetails.getMaterial());
//            existingProduct.setPrice(productDetails.getPrice());
//            existingProduct.setStockQuantity(productDetails.getStockQuantity());
//            return productRepository.save(existingProduct); // Save the updated version
//        }).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
//    }
//
//    // 5. DELETE: Remove a product from the database
//    public void deleteProduct(String id) {
//        productRepository.deleteById(id);
//    }
//}