package com.lifeos.backend.project;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByUser(User user);
    List<Project> findByUserAndUpdatedAtAfter(User user, LocalDateTime timestamp);
}
