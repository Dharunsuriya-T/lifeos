package com.lifeos.backend.sync.dto;

import com.lifeos.backend.project.ProjectStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectDto(
    UUID id,
    UUID goalId,
    String title,
    String description,
    ProjectStatus status,
    LocalDateTime deadline,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
