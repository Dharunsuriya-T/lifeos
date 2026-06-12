package com.lifeos.backend.sync.dto;

import com.lifeos.backend.learning.LearningStatus;
import com.lifeos.backend.learning.LearningType;

import java.time.LocalDateTime;
import java.util.UUID;

public record LearningItemDto(
    UUID id,
    UUID goalId,
    UUID roadmapNodeId,
    String title,
    String description,
    LearningType type,
    LearningStatus status,
    int progressPercentage,
    Integer totalLessonsPages,
    Integer completedLessonsPages,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
