package com.lifeos.backend.project;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, UUID> {
    List<ProjectMilestone> findByProject(Project project);

    @Query("SELECT pm FROM ProjectMilestone pm JOIN pm.project p WHERE p.user = :user AND pm.updatedAt > :timestamp")
    List<ProjectMilestone> findByUserAndUpdatedAtAfter(@Param("user") User user, @Param("timestamp") LocalDateTime timestamp);
}
