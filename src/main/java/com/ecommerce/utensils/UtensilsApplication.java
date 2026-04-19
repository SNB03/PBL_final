package com.ecommerce.utensils;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
@SpringBootApplication
@EnableAsync
public class UtensilsApplication {

	public static void main(String[] args) {

		SpringApplication.run(UtensilsApplication.class, args);
	}

}
