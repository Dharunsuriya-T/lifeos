package com.lifeos.backend.sync.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record HabitLogDto(
    UUID id,
    UUID habitId,
    LocalDate completedDate,
    boolean isCompleted,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
