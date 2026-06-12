package com.lifeos.backend.sync.dto;

import com.lifeos.backend.task.TaskPriority;
import com.lifeos.backend.task.TaskStatus;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record TaskDto(
    UUID id,
    UUID goalId,
    UUID projectId,
    UUID roadmapNodeId,
    String title,
    String description,
    LocalDateTime dueDate,
    TaskPriority priority,
    TaskStatus status,
    boolean isRecurring,
    String recurrencePattern,
    UUID parentTaskId,
    int estimatedTime,
    int actualTime,
    String lifeArea,
    Set<UUID> dependencyIds,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
