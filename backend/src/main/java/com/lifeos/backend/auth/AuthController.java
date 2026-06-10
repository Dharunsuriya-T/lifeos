package com.lifeos.backend.auth;

import com.lifeos.backend.user.dto.RegisterRequest;
import com.lifeos.backend.user.dto.UserResponse;
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
}