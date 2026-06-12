package com.lifeos.backend.goal;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {
    List<Goal> findByUser(User user);
    List<Goal> findByUserAndUpdatedAtAfter(User user, LocalDateTime timestamp);
}
