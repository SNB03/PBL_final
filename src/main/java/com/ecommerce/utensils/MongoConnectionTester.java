package com.ecommerce.utensils;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class MongoConnectionTester implements CommandLineRunner {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) {
        System.out.println("\n=========================================================");
        System.out.println("🚀 MONGODB CONNECTION TEST STARTING...");
        System.out.println("=========================================================");

        try {
            // Attempt to ping the database to force a real network connection
            Document pingResult = mongoTemplate.executeCommand("{ ping: 1 }");

            System.out.println("\n✅ SUCCESS! Connection is perfectly working.");
            System.out.println("✅ Ping response from Atlas: " + pingResult.toJson());
            System.out.println("✅ Connected to Database: " + mongoTemplate.getDb().getName());

        } catch (Exception e) {
            System.err.println("\n❌ !!! CONNECTION FAILED !!! ❌");
            System.err.println("Here is the exact reason why your app cannot connect:\n");

            // Print the main error message
            System.err.println("🛑 ERROR MESSAGE: " + e.getMessage());

            // Dig down to find the absolute root cause of the error
            Throwable rootCause = getRootCause(e);
            if (rootCause != null && !rootCause.equals(e)) {
                System.err.println("🛑 ROOT CAUSE: " + rootCause.getMessage());
            }

            System.err.println("\n(Check the console logs above for the full stack trace if needed)");
        }
        System.out.println("=========================================================\n");
    }

    // Helper method to dig through the error chain
    private Throwable getRootCause(Throwable e) {
        Throwable cause = null;
        Throwable result = e;
        while (null != (cause = result.getCause()) && (result != cause)) {
            result = cause;
        }
        return result;
    }
}