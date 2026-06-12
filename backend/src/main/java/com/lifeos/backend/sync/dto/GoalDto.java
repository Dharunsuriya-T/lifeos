package com.lifeos.backend.sync.dto;

import com.lifeos.backend.goal.GoalPriority;
import com.lifeos.backend.goal.GoalStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record GoalDto(
    UUID id,
    String title,
    String description,
    GoalPriority priority,
    GoalStatus status,
    int progressPercentage,
    LocalDateTime targetDate,
    String lifeArea,
    String motivation,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
