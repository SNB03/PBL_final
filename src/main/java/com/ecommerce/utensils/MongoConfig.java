package com.ecommerce.utensils;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
public class MongoConfig {

    @Bean
    public MongoClient mongoClient() {
        // This forces the connection to Atlas using your URL-encoded password
        return MongoClients.create("mongodb+srv://sb03:sujitb%4003@utensilcluster.eyovvlh.mongodb.net/utensils_db?appName=UtensilCluster");
    }

    @Bean
    public MongoTemplate mongoTemplate() {
        return new MongoTemplate(mongoClient(), "utensils_db");
    }
}