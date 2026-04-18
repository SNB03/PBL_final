package com.ecommerce.utensils.repository;

import com.ecommerce.utensils.model.DeliveryStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryStaffRepository extends JpaRepository<DeliveryStaff, Long> {}