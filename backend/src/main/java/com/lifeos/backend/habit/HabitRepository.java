package com.lifeos.backend.habit;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface HabitRepository extends JpaRepository<Habit, UUID> {
    List<Habit> findByUser(User user);
    List<Habit> findByUserAndUpdatedAtAfter(User user, LocalDateTime timestamp);
}
