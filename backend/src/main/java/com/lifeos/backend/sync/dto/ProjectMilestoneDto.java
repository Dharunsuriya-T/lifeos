package com.lifeos.backend.sync.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectMilestoneDto(
    UUID id,
    UUID projectId,
    String title,
    String description,
    boolean isCompleted,
    LocalDateTime dueDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
