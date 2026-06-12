package com.lifeos.backend.task;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUser(User user);
    List<Task> findByUserAndUpdatedAtAfter(User user, LocalDateTime timestamp);
}
