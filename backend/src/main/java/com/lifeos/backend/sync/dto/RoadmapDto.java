package com.lifeos.backend.sync.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record RoadmapDto(
    UUID id,
    UUID goalId,
    String title,
    String description,
    boolean isTemplate,
    boolean isPublic,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
