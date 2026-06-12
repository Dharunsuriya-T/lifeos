package com.lifeos.backend.habit;

import com.lifeos.backend.common.BaseEntity;
import com.lifeos.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "habits")
@Getter
@Setter
@NoArgsConstructor
public class Habit extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HabitFrequency frequency;

    @Column(nullable = false)
    private int streak;
}
