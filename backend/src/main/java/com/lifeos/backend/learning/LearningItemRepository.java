package com.lifeos.backend.learning;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LearningItemRepository extends JpaRepository<LearningItem, UUID> {
    List<LearningItem> findByUser(User user);
    List<LearningItem> findByUserAndUpdatedAtAfter(User user, LocalDateTime timestamp);
}
