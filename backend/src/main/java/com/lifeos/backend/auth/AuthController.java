package com.lifeos.backend.auth;

import com.lifeos.backend.user.dto.*;
import com.lifeos.backend.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public UserResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        System.out.println("REGISTER ENDPOINT HIT");
        return userService.register(request);
    }
    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return userService.login(request);
    }

    @PostMapping("/refresh")
    public AccessTokenResponse refresh(
            @Valid
            @RequestBody
            RefreshTokenRequest request
    ) {

        return userService
                .refreshAccessToken(
                        request
                );
    }

    @PostMapping("/logout")
    public void logout(
            @Valid
            @RequestBody
            RefreshTokenRequest request
    ) {

        userService.logout(
                request
        );
    }

    @PostMapping("/google")
    public LoginResponse googleLogin(
            @Valid
            @RequestBody
            GoogleLoginRequest request
    ) throws Exception {

        return userService.googleLogin(
                request
        );
    }
}