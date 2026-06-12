package com.lifeos.backend.roadmap;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoadmapNodeRepository extends JpaRepository<RoadmapNode, UUID> {
    List<RoadmapNode> findByRoadmap(Roadmap roadmap);

    @Query("SELECT rn FROM RoadmapNode rn JOIN rn.roadmap r WHERE r.user = :user AND rn.updatedAt > :timestamp")
    List<RoadmapNode> findByUserAndUpdatedAtAfter(@Param("user") User user, @Param("timestamp") LocalDateTime timestamp);
}
