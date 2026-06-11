package com.lifeos.backend.user.service;

import com.lifeos.backend.exception.EmailAlreadyExistsException;
import com.lifeos.backend.exception.InvalidCredentialsException;
import com.lifeos.backend.security.GoogleTokenService;
import com.lifeos.backend.security.RefreshToken;
import com.lifeos.backend.security.RefreshTokenRepository;
import com.lifeos.backend.user.*;
import com.lifeos.backend.security.JwtService;
import com.lifeos.backend.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final GoogleTokenService googleTokenService;
    public UserResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = new User();

        user.setId(UUID.randomUUID());

        user.setEmail(request.email());

        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );

        user.setFirstName(request.firstName());

        user.setLastName(request.lastName());

        user.setRole(Role.USER);

        user.setAuthProvider(AuthProvider.LOCAL);

        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName()
        );
    }

    public LoginResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmail(request.email())
                .orElseThrow(
                        () -> new InvalidCredentialsException(
                                "Invalid email or password"
                        )
                );

        boolean passwordMatches =
                passwordEncoder.matches(
                        request.password(),
                        user.getPasswordHash()
                );

        if (!passwordMatches) {
            throw new InvalidCredentialsException(
                    "Invalid email or password"
            );
        }

        String accessToken =
                jwtService.generateAccessToken(
                        user.getEmail()
                );

        String refreshToken =
                jwtService.generateRefreshToken(
                        user.getEmail()
                );

        RefreshToken refreshTokenEntity =
                new RefreshToken();

        refreshTokenEntity.setId(
                UUID.randomUUID()
        );

        refreshTokenEntity.setToken(
                refreshToken
        );

        refreshTokenEntity.setUser(
                user
        );

        refreshTokenEntity.setExpiresAt(
                jwtService.getRefreshTokenExpiryDate()
        );

        refreshTokenEntity.setRevoked(false);

        refreshTokenRepository.save(
                refreshTokenEntity
        );

        return new LoginResponse(
                accessToken,
                refreshToken
        );
    }

    public AccessTokenResponse refreshAccessToken(
            RefreshTokenRequest request
    ) {

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByToken(
                                request.refreshToken()
                        )
                        .orElseThrow(
                                () -> new InvalidCredentialsException(
                                        "Invalid refresh token"
                                )
                        );

        if (!jwtService.isRefreshTokenValid(
                refreshToken
        )) {

            throw new InvalidCredentialsException(
                    "Invalid refresh token"
            );
        }

        String accessToken =
                jwtService.generateAccessToken(
                        refreshToken.getUser().getEmail()
                );

        return new AccessTokenResponse(
                accessToken
        );
    }

    public void logout(
            RefreshTokenRequest request
    ) {

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByToken(
                                request.refreshToken()
                        )
                        .orElseThrow(
                                () -> new InvalidCredentialsException(
                                        "Invalid refresh token"
                                )
                        );

        refreshToken.setRevoked(true);

        refreshTokenRepository.save(
                refreshToken
        );
    }

    public LoginResponse googleLogin(
            GoogleLoginRequest request
    ) throws Exception {

        var payload =
                googleTokenService.verify(
                        request.idToken()
                );

        String email =
                payload.getEmail();

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseGet(() -> {

                            User newUser = new User();

                            newUser.setId(
                                    UUID.randomUUID()
                            );

                            newUser.setEmail(email);

                            newUser.setFirstName(
                                    (String) payload.get("given_name")
                            );

                            newUser.setLastName(
                                    (String) payload.get("family_name")
                            );

                            newUser.setRole(Role.USER);

                            newUser.setAuthProvider(
                                    AuthProvider.GOOGLE
                            );

                            newUser.setEnabled(true);

                            return userRepository.save(
                                    newUser
                            );
                        });

        String accessToken =
                jwtService.generateAccessToken(
                        user.getEmail()
                );

        String refreshToken =
                jwtService.generateRefreshToken(
                        user.getEmail()
                );

        RefreshToken refreshTokenEntity =
                new RefreshToken();

        refreshTokenEntity.setId(
                UUID.randomUUID()
        );

        refreshTokenEntity.setToken(
                refreshToken
        );

        refreshTokenEntity.setUser(
                user
        );

        refreshTokenEntity.setExpiresAt(
                jwtService.getRefreshTokenExpiryDate()
        );

        refreshTokenEntity.setRevoked(false);

        refreshTokenRepository.save(
                refreshTokenEntity
        );

        return new LoginResponse(
                accessToken,
                refreshToken
        );
    }
}