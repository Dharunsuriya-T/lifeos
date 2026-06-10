package com.lifeos.backend;

import java.time.ZoneId;
import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {

        System.out.println("Before:");
        System.out.println(ZoneId.systemDefault());
        System.out.println(TimeZone.getDefault().getID());

        //TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));

        System.out.println("After:");
        System.out.println(ZoneId.systemDefault());
        System.out.println(TimeZone.getDefault().getID());

        SpringApplication.run(BackendApplication.class, args);
    }
}