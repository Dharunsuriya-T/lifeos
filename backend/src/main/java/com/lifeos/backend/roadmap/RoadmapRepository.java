package com.lifeos.backend.roadmap;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoadmapRepository extends JpaRepository<Roadmap, UUID> {
    List<Roadmap> findByUser(User user);
    List<Roadmap> findByIsPublicTrueAndIsTemplateTrue();
    List<Roadmap> findByUserAndUpdatedAtAfter(User user, LocalDateTime timestamp);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Roadmap r WHERE (r.user = :user OR r.isPublic = true) AND r.updatedAt > :timestamp")
    List<Roadmap> findByUserOrPublicAndUpdatedAtAfter(@org.springframework.data.repository.query.Param("user") User user, @org.springframework.data.repository.query.Param("timestamp") LocalDateTime timestamp);
}
