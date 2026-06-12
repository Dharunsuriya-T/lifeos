package com.lifeos.backend.sync.dto;

import com.lifeos.backend.roadmap.RoadmapNodeStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record RoadmapNodeDto(
    UUID id,
    UUID roadmapId,
    UUID parentNodeId,
    String title,
    String description,
    String resources,
    RoadmapNodeStatus status,
    int orderIndex,
    LocalDateTime deadline,
    int progress,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
