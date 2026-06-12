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
}
