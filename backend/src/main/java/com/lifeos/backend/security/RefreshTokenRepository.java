package com.lifeos.backend.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, UUID> {

    @Query("""
    SELECT rt
    FROM RefreshToken rt
    JOIN FETCH rt.user
    WHERE rt.token = :token
""")
    Optional<RefreshToken> findByToken(
            @Param("token") String token
    );
}