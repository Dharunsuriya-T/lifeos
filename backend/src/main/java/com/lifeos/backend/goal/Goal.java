package com.lifeos.backend.goal;

import com.lifeos.backend.common.BaseEntity;
import com.lifeos.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "goals")
@Getter
@Setter
@NoArgsConstructor
public class Goal extends BaseEntity {

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
    private GoalPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoalStatus status;

    @Column(name = "progress_percentage", nullable = false)
    private int progressPercentage;

    @Column(name = "target_date")
    private LocalDateTime targetDate;

    @Column(name = "life_area")
    private String lifeArea;

    private String motivation;
}
