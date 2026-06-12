package com.lifeos.backend.habit;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, UUID> {
    List<HabitLog> findByHabit(Habit habit);
    Optional<HabitLog> findByHabitAndCompletedDate(Habit habit, LocalDate date);

    @Query("SELECT hl FROM HabitLog hl JOIN hl.habit h WHERE h.user = :user AND hl.updatedAt > :timestamp")
    List<HabitLog> findByUserAndUpdatedAtAfter(@Param("user") User user, @Param("timestamp") LocalDateTime timestamp);
}
