package com.lifeos.backend;

import java.time.ZoneId;
import java.util.TimeZone;

public class TimezoneTest {
    public static void main(String[] args) {
        System.out.println("ZoneId.systemDefault() = " + ZoneId.systemDefault());
        System.out.println("TimeZone.getDefault() = " + TimeZone.getDefault().getID());
    }
}