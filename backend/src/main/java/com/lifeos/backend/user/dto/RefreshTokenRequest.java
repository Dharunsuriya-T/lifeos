package com.lifeos.backend.user.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(

        @NotBlank
        String refreshToken

) {}