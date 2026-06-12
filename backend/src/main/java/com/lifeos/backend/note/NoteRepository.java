package com.lifeos.backend.note;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {
    List<Note> findByUser(User user);
    List<Note> findByUserAndUpdatedAtAfter(User user, LocalDateTime timestamp);
}
