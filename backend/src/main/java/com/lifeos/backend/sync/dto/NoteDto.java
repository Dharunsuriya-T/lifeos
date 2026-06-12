package com.lifeos.backend.sync.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NoteDto(
    UUID id,
    UUID goalId,
    UUID taskId,
    UUID projectId,
    UUID roadmapNodeId,
    UUID learningItemId,
    String title,
    String content,
    String category,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
