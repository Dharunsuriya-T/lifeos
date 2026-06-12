package com.lifeos.backend.sync.dto;

import com.lifeos.backend.habit.HabitFrequency;

import java.time.LocalDateTime;
import java.util.UUID;

public record HabitDto(
    UUID id,
    String title,
    String description,
    HabitFrequency frequency,
    int streak,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
