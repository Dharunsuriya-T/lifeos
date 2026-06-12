package com.lifeos.backend.roadmap;

import com.lifeos.backend.common.BaseEntity;
import com.lifeos.backend.goal.Goal;
import com.lifeos.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "roadmaps")
@Getter
@Setter
@NoArgsConstructor
public class Roadmap extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "is_template", nullable = false)
    private boolean isTemplate;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;
}
