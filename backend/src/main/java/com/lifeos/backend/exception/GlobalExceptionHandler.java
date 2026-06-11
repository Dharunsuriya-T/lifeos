package com.lifeos.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(
            EmailAlreadyExistsException ex
    ) {

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(
                        new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.CONFLICT.value(),
                                ex.getMessage()
                        )
                );
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException ex
    ) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(
                        new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.UNAUTHORIZED.value(),
                                ex.getMessage()
                        )
                );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex
    ) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        Map<String, Object> response = new HashMap<>();

        response.put("timestamp", LocalDateTime.now());
        response.put("status", 400);
        response.put("message", "Validation failed");
        response.put("errors", errors);

        return ResponseEntity.badRequest().body(response);
    }
}